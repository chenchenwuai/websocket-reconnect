export declare class Event {
    target: any;
    type: string;
    constructor(type: string, target: any);
}
export declare class ErrorEvent extends Event {
    message: string;
    error: Error;
    constructor(error: Error, target: any);
}
export declare class CloseEvent extends Event {
    code: number;
    reason: string;
    wasClean: boolean;
    constructor(code: number | undefined, reason: string | undefined, target: any);
}
export declare type ReconnectEventParams = {
    maxRetries: number;
    retryCount: number;
};
export interface WebSocketEventMap {
    close: CloseEvent;
    error: ErrorEvent;
    message: MessageEvent;
    open: Event;
    reconnect: ReconnectEventParams;
}
export interface WebSocketEventListenerMap {
    close: (event: CloseEvent) => void | {
        handleEvent: (event: CloseEvent) => void;
    };
    error: (event: ErrorEvent) => void | {
        handleEvent: (event: ErrorEvent) => void;
    };
    message: (event: MessageEvent) => void | {
        handleEvent: (event: MessageEvent) => void;
    };
    open: (event: Event) => void | {
        handleEvent: (event: Event) => void;
    };
    reconnect: (options: ReconnectEventParams) => void;
}
export declare type ListenersMap = {
    error: Array<WebSocketEventListenerMap['error']>;
    message: Array<WebSocketEventListenerMap['message']>;
    open: Array<WebSocketEventListenerMap['open']>;
    close: Array<WebSocketEventListenerMap['close']>;
    reconnect: Array<WebSocketEventListenerMap['reconnect']>;
};
export declare type Message = string | ArrayBufferLike | Blob | ArrayBufferView;
export declare type Options = {
    WebSocket?: any;
    maxReconnectionDelay?: number;
    minReconnectionDelay?: number;
    reconnectionDelayGrowFactor?: number;
    minUptime?: number;
    connectionTimeout?: number;
    maxRetries?: number;
    maxEnqueuedMessages?: number;
    startClosed?: boolean;
    enableHeartbeat?: boolean;
    pingTimeout?: number;
    pongTimeout?: number;
    pingMsg?: Message;
    debug?: boolean;
};
export declare type UrlProvider = string | (() => string) | (() => Promise<string>);
export default class WebsocketReconnect {
    private _ws?;
    private _binaryType;
    private _messageQueue;
    private _listeners;
    private _retryCount;
    private _uptimeTimeout;
    private _connectTimeout;
    private _shouldReconnect;
    private _connectLock;
    private _closeCalled;
    private _pingIntervalId;
    private _pongTimeoutId;
    private readonly _url;
    private readonly _protocols;
    protected readonly _options: Required<Options>;
    constructor(url: UrlProvider, protocols?: string | string[], options?: Options);
    get binaryType(): BinaryType;
    set binaryType(value: BinaryType);
    get messageQueue(): Message[];
    set messageQueue(value: Message[]);
    get retryCount(): number;
    get bufferedAmount(): number;
    get extensions(): string;
    get protocol(): string;
    get readyState(): number;
    get url(): string;
    static get CONNECTING(): number;
    static get OPEN(): number;
    static get CLOSING(): number;
    static get CLOSED(): number;
    get CONNECTING(): number;
    get OPEN(): number;
    get CLOSING(): number;
    get CLOSED(): number;
    onclose: ((event: CloseEvent) => any) | null;
    onerror: ((event: ErrorEvent) => any) | null;
    onmessage: ((message: MessageEvent) => void) | null;
    onopen: ((event: Event) => void) | null;
    onreconnect: ((options: ReconnectEventParams) => void) | null;
    close(code?: number, reason?: string): void;
    send(data: Message): void;
    addEventListener<T extends keyof WebSocketEventListenerMap>(type: T, listener: WebSocketEventListenerMap[T]): void;
    removeEventListener<T extends keyof WebSocketEventListenerMap>(type: T, listener: WebSocketEventListenerMap): void;
    dispatchEvent(event: Event): boolean;
    private _callEventListener;
    reconnect(code?: number, reason?: string): void;
    private _connect;
    private _disconnect;
    private _handleOpen;
    private _handleMessage;
    private _handleClose;
    private _handleError;
    private _handleReconnect;
    private _wait;
    private _getNextDelay;
    private _getNextUrl;
    private _handleTimeout;
    private _acceptOpen;
    private _debug;
    private _addEventListeners;
    private _removeListeners;
    private _heartCheck;
    private _heartStart;
    private _heartReset;
    private _clearTimeouts;
}
