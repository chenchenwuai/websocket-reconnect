export class Event {
	public target: any;
	public type: string;
	constructor (type: string, target: any) {
		this.target = target
		this.type = type
	}
}
export class ErrorEvent extends Event {
	public message: string;
	public error: Error;
	constructor (error: Error, target: any) {
		super('error', target)
		this.message = error.message
		this.error = error
	}
}
export class CloseEvent extends Event {
	public code: number;
	public reason: string;
	public wasClean = true;
	constructor (code = 1000, reason = '', target: any) {
		super('close', target)
		this.code = code
		this.reason = reason
	}
}
export interface WebSocketEventMap {
	close: CloseEvent;
	error: ErrorEvent;
	message: MessageEvent;
	open: Event;
}
export interface WebSocketEventListenerMap {
	close: (event: CloseEvent) => void | {handleEvent: (event: CloseEvent) => void};
	error: (event: ErrorEvent) => void | {handleEvent: (event: ErrorEvent) => void};
	message: (event: MessageEvent) => void | {handleEvent: (event: MessageEvent) => void};
	open: (event: Event) => void | {handleEvent: (event: Event) => void};
}
export type ListenersMap = {
	error: Array<WebSocketEventListenerMap['error']>;
	message: Array<WebSocketEventListenerMap['message']>;
	open: Array<WebSocketEventListenerMap['open']>;
	close: Array<WebSocketEventListenerMap['close']>;
}
export type Message = string | ArrayBufferLike | Blob | ArrayBufferView
export type Options = {
	WebSocket?: any
	maxReconnectionDelay?: number
	minReconnectionDelay?: number
	reconnectionDelayGrowFactor?: number
	minUptime?: number
	connectionTimeout?: number
	maxRetries?: number
	maxEnqueuedMessages?: number
	startClosed?: boolean
	debug?: boolean
}
export type UrlProvider = string | (() => string) | (() => Promise<string>)

const DEFAULT = {
	maxReconnectionDelay: 10000,
	minReconnectionDelay: 1000 + Math.random() * 4000,
	minUptime: 5000,
	reconnectionDelayGrowFactor: 1.3,
	connectionTimeout: 4000,
	maxRetries: Infinity,
	maxEnqueuedMessages: Infinity,
	startClosed: false,
	debug: false
}

const getGlobalWebSocket = (): WebSocket | undefined => {
	if (typeof WebSocket !== 'undefined') {
		// @ts-ignore
		return WebSocket
	}
}

const isWebSocket = (w: any) => typeof w !== 'undefined' && !!w && w.CLOSING === 2

export default class WebsocketReconnect {
	private _ws?: WebSocket
	private _binaryType: BinaryType = 'blob'
	private _messageQueue: Message[] = []
	private _listeners: ListenersMap = {
		error: [],
		message: [],
		open: [],
		close: []
	}

	private _retryCount = -1
	private _uptimeTimeout: any
	private _connectTimeout: any
	private _shouldReconnect = true
	private _connectLock = false
	private _closeCalled = false

	private readonly _url: UrlProvider
	private readonly _protocols: string | string[]
	private readonly _options: Options

	constructor (url: UrlProvider, protocols?: string | string[], options: Options = {}) {
		this._url = url
		this._protocols = protocols ?? ''
		this._options = options
		if (this._options.startClosed) {
			this._shouldReconnect = false
		}
		this._connect()
	}
	/**
	 * Returns a string that indicates how binary data from the WebSocket object is exposed to scripts:
	 *
	 * Can be set, to change how binary data is returned. The default is "blob".
	 */
	get binaryType (): BinaryType {
		return this._ws ? this._ws.binaryType : this._binaryType
	}
	set binaryType (value: BinaryType) {
		this._binaryType = value
		if (this._ws) {
			this._ws.binaryType = value
		}
	}

	/**
	 * Returns the number or connection retries
	 */
	get retryCount (): number {
		return Math.max(this._retryCount, 0)
	}
	/**
	 * Returns the number of bytes of application data (UTF-8 text and binary data) that have been queued using send() but not yet been transmitted to the network.
	 *
	 * If the WebSocket connection is closed, this attribute's value will only increase with each call to the send() method. (The number does not reset to zero once the connection closes.)
	 */
	get bufferedAmount (): number {
		const bytes = this._messageQueue.reduce((acc, message) => {
			if (typeof message === 'string') {
				acc += message.length
			} else if (message instanceof Blob) {
				acc += message.size
			} else {
				acc += message.byteLength
			}
			return acc
		}, 0)
		return bytes + (this._ws ? this._ws.bufferedAmount : 0)
	}
	/**
	 * Returns the extensions selected by the server, if any.
	 */
	get extensions (): string {
		return this._ws ? this._ws.extensions : ''
	}
	/**
	 * Returns the subprotocol selected by the server, if any. It can be used in conjunction with the array form of the constructor's second argument to perform subprotocol negotiation.
	 */
	get protocol (): string {
		return this._ws ? this._ws.protocol : ''
	}
	/**
	 * Returns the state of the WebSocket object's connection. It can have the values described below.
	 */
	get readyState (): number {
		if (this._ws) {
			return this._ws.readyState
		}
		return this._options.startClosed ? WebSocket.CLOSED : WebSocket.CLOSING
	}
	/**
	 * Returns the URL that was used to establish the WebSocket connection.
	 */
	get url (): string {
		return this._ws ? this._ws.url : ''
	}

	static get CONNECTING (): number {
		return 0
	}
	static get OPEN (): number {
		return 1
	}
	static get CLOSING (): number {
		return 2
	}
	static get CLOSED (): number {
		return 3
	}

	get CONNECTING (): number {
		return WebSocket.CONNECTING
	}
	get OPEN (): number {
		return WebSocket.OPEN
	}
	get CLOSING (): number {
		return WebSocket.CLOSING
	}
	get CLOSED (): number {
		return WebSocket.CLOSED
	}

	/**
	 * An event listener to be called when the WebSocket connection's readyState changes to CLOSED
	 */
	public onclose: ((event: CloseEvent) => any) | null = null
	/**
	 * An event listener to be called when an error occurs
	 */
	public onerror: ((event: ErrorEvent) => any)|null = null
	/**
	 * An event listener to be called when a message is received from the server
	 */
	public onmessage: ((message: MessageEvent) => void) | null = null
	/**
	 * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
	 * this indicates that the connection is ready to send and receive data
	 */
	public onopen: ((event: Event) => void) | null = null

	/**
	 * Closes the WebSocket connection or connection attempt, if any. If the connection is already
	 * CLOSED, this method does nothing
	 */
	public close (code?: number, reason?: string): void {
		this._closeCalled = true
		this._shouldReconnect = false
		this._clearTimeouts()
		if (!this._ws) {
			this._debug('close enqueued: no ws instance')
			return
		}
		if (this._ws.readyState === this.CLOSED) {
			this._debug('close: already closed')
			return
		}
		this._ws.close(code, reason)
	}
	/**
	 * Enqueue specified data to be transmitted to the server over the WebSocket connection
	 */
	public send (data: Message): void {
		if (this._ws && this._ws.readyState === this.OPEN) {
			this._debug('send', data)
			this._ws.send(data)
		} else {
			const { maxEnqueuedMessages = DEFAULT.maxEnqueuedMessages } = this._options
			if (this._messageQueue.length < maxEnqueuedMessages) {
				this._debug('enqueue', data)
				this._messageQueue.push(data)
			}
		}
	}

	/**
	 * Register an event handler of a specific event type
	 */
	public addEventListener<T extends keyof WebSocketEventListenerMap> (
		type: T,
		listener: WebSocketEventListenerMap[T]
	): void {
		if (this._listeners[type]) {
			// @ts-ignore
			this._listeners[type].push(listener)
		}
	}
	/**
	 * Removes an event listener
	 */
	public removeEventListener<T extends keyof WebSocketEventListenerMap> (
		type: T,
		listener: WebSocketEventListenerMap
	): void {
		if (this._listeners[type]) {
			// @ts-ignore
			this._listeners = this._listeners[type].filter(l => l !== listener)
		}
	}

	/**
	 * dispatch event
	 * @param event Event
	 */
	public dispatchEvent (event: Event): boolean {
		const listeners = this._listeners[event.type as keyof WebSocketEventListenerMap]
		if (listeners) {
			for (const listener of listeners) {
				// @ts-ignore
				this._callEventListener(event, listener)
			}
		}
		return true
	}

	private _callEventListener<T extends keyof WebSocketEventListenerMap> (
		event: WebSocketEventMap[T],
		listener: WebSocketEventListenerMap[T]
	): void {
		if ('handleEvent' in listener) {
			// @ts-ignore
			listener.handleEvent(event)
		} else {
			// @ts-ignore
			listener(event)
		}
	}

	/**
	 * Closes the WebSocket connection or connection attempt and connects again.
	 * Resets retry counter;
	 */
	public reconnect (code?: number, reason?: string): void {
		this._shouldReconnect = true
		this._closeCalled = false
		this._retryCount = -1
		if (!this._ws || this._ws.readyState === WebSocket.CLOSED) {
			this._connect()
		} else {
			this._disconnect(code, reason)
			this._connect()
		}
	}

	private _connect () {
		if (this._connectLock || !this._shouldReconnect) {
			return
		}
		this._connectLock = true

		const {
			maxRetries = DEFAULT.maxRetries,
			connectionTimeout = DEFAULT.connectionTimeout,
			WebSocket = getGlobalWebSocket()
		} = this._options

		if (this._retryCount >= maxRetries) {
			this._debug('max retries reached', this._retryCount, '>=', maxRetries)
			return
		}

		this._retryCount++

		this._debug('connect', this._retryCount)
		this._removeListeners()

		if (!isWebSocket(WebSocket)) {
			throw Error('No valid WebSocket class provided')
		}

		this._wait()
			.then(() => this._getNextUrl(this._url))
			.then(url => {
				if (this._closeCalled) {
					return
				}
				this._debug('connect', { url, protocols: this._protocols })
				this._ws = this._protocols ? new WebSocket(url, this._protocols) : new WebSocket(url)
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				this._ws!.binaryType = this._binaryType
				this._connectLock = false
				this._addEventListeners()

				this._connectTimeout = setTimeout(() => this._handleTimeout(), connectionTimeout)
			})
	}

	private _disconnect (code = 1000, reason?: string) {
		this._clearTimeouts()
		if (!this._ws) {
			return
		}
		this._removeListeners()
		try {
			this._ws.close(code, reason)
			this._handleClose(new CloseEvent(code, reason, this))
		} catch (error) {
			throw Error(error)
		}
	}

	private _handleOpen = (event: Event) => {
		this._debug('open event')
		const { minUptime = DEFAULT.minUptime } = this._options

		clearTimeout(this._connectTimeout)
		this._uptimeTimeout = setTimeout(() => this._acceptOpen(), minUptime)

		if (this._ws) {
			this._ws.binaryType = this._binaryType
		}

		this._messageQueue.forEach(message => this._ws?.send(message))
		this._messageQueue = []

		if (this.onopen) {
			this.onopen(event)
		}
		this._listeners.open.forEach(listener => this._callEventListener(event, listener))
	}
	private _handleMessage = (event: MessageEvent) => {
		this._debug('message event')
		if (this.onmessage) {
			this.onmessage(event)
		}
		this._listeners.message.forEach(listener => this._callEventListener(event, listener))
	}
	private _handleClose = (event: CloseEvent) => {
		this._debug('close event')
		this._clearTimeouts()
		if (this._shouldReconnect) {
			this._connect()
		}
		if (this.onclose) {
			this.onclose(event)
		}
		this._listeners.close.forEach(listener => this._callEventListener(event, listener))
	}
	private _handleError = (event: ErrorEvent) => {
		this._debug('error event', event.message)
		this._disconnect(undefined, event.message === 'TIMEOUT' ? 'timeout' : undefined)

		if (this.onerror) {
			this.onerror(event)
		}
		this._debug('exec error listeners')
		this._listeners.error.forEach(listener => this._callEventListener(event, listener))

		this._connect()
	}

	private _wait (): Promise<void> {
		return new Promise(resolve => {
			setTimeout(resolve, this._getNextDelay())
		})
	}

	private _getNextDelay (): number {
		const {
			reconnectionDelayGrowFactor = DEFAULT.reconnectionDelayGrowFactor,
			minReconnectionDelay = DEFAULT.minReconnectionDelay,
			maxReconnectionDelay = DEFAULT.maxReconnectionDelay
		} = this._options
		let delay = 0
		if (this._retryCount > 0) {
			delay = minReconnectionDelay * Math.pow(reconnectionDelayGrowFactor, this._retryCount)
			if (delay > maxReconnectionDelay) {
				delay = maxReconnectionDelay
			}
		}
		this._debug('next delay', delay)
		return delay
	}

	private _getNextUrl (urlProvider: UrlProvider): Promise<string> {
		if (typeof urlProvider === 'string') {
			return Promise.resolve(urlProvider)
		} else if (typeof urlProvider === 'function') {
			const url = urlProvider()
			if (typeof url === 'string') {
				return Promise.resolve(url)
			}
			if (url.then !== undefined) {
				return url
			}
		}
		throw Error('Invalid URL')
	}

	private _handleTimeout () {
		this._debug('timeout event')
		this._handleError(new ErrorEvent(Error('TIMEOUT'), this))
	}

	private _acceptOpen () {
		this._debug('accept open')
		this._retryCount = 0
	}

	private _debug (...args: any[]) {
		if (this._options.debug) {
			console.log('WSR', ...args)
		}
	}

	private _addEventListeners () {
		if (!this._ws) {
			return
		}
		this._debug('addListeners')
		this._ws.addEventListener('open', this._handleOpen)
		this._ws.addEventListener('message', this._handleMessage)
		this._ws.addEventListener('close', this._handleClose)
		// @ts-ignore
		this._ws.addEventListener('error', this._handleError)
	}
	private _removeListeners () {
		if (!this._ws) {
			return
		}
		this._ws.removeEventListener('open', this._handleOpen)
		this._ws.removeEventListener('message', this._handleMessage)
		this._ws.removeEventListener('close', this._handleClose)
		// @ts-ignore
		this._ws.removeEventListener('error', this._handleError)
	}

	private _clearTimeouts (): void {
		clearTimeout(this._connectTimeout)
		clearTimeout(this._uptimeTimeout)
	}
}
