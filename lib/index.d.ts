
declare class CloseEvent_2 extends Event_2 {
    code: number;
    reason: string;
    wasClean: boolean;
    constructor(code: number | undefined, reason: string | undefined, target: any);
}
export { CloseEvent_2 as CloseEvent }

declare class ErrorEvent_2 extends Event_2 {
    message: string;
    error: Error;
    constructor(error: Error, target: any);
}
export { ErrorEvent_2 as ErrorEvent }

declare class Event_2 {
    target: any;
    type: string;
    constructor(type: string, target: any);
}
export { Event_2 as Event }

export declare type ListenersMap = {
    error: Array<WebSocketEventListenerMap['error']>;
    message: Array<WebSocketEventListenerMap['message']>;
    open: Array<WebSocketEventListenerMap['open']>;
    close: Array<WebSocketEventListenerMap['close']>;
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
    debug?: boolean;
};

export declare type UrlProvider = string | (() => string) | (() => Promise<string>);

export declare interface WebSocketEventListenerMap {
    close: (event: CloseEvent_2) => void | {
        handleEvent: (event: CloseEvent_2) => void;
    };
    error: (event: ErrorEvent_2) => void | {
        handleEvent: (event: ErrorEvent_2) => void;
    };
    message: (event: MessageEvent) => void | {
        handleEvent: (event: MessageEvent) => void;
    };
    open: (event: Event_2) => void | {
        handleEvent: (event: Event_2) => void;
    };
}

declare interface WebSocketEventMap_2 {
    close: CloseEvent_2;
    error: ErrorEvent_2;
    message: MessageEvent;
    open: Event_2;
}
export { WebSocketEventMap_2 as WebSocketEventMap }

declare class WebsocketReconnect {
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
    private readonly _url;
    private readonly _protocols;
    private readonly _options;
    constructor(url: UrlProvider, protocols?: string | string[], options?: Options);
    get binaryType(): BinaryType;
    set binaryType(value: BinaryType);
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
    onclose: ((event: CloseEvent_2) => any) | null;
    onerror: ((event: ErrorEvent_2) => any) | null;
    onmessage: ((message: MessageEvent) => void) | null;
    onopen: ((event: Event_2) => void) | null;
    close(code?: number, reason?: string): void;
    send(data: Message): void;
    addEventListener<T extends keyof WebSocketEventListenerMap>(type: T, listener: WebSocketEventListenerMap[T]): void;
    removeEventListener<T extends keyof WebSocketEventListenerMap>(type: T, listener: WebSocketEventListenerMap): void;
    dispatchEvent(event: Event_2): boolean;
    private _callEventListener;
    reconnect(code?: number, reason?: string): void;
    private _connect;
    private _disconnect;
    private _handleOpen;
    private _handleMessage;
    private _handleClose;
    private _handleError;
    private _wait;
    private _getNextDelay;
    private _getNextUrl;
    private _handleTimeout;
    private _acceptOpen;
    private _debug;
    private _addEventListeners;
    private _removeListeners;
    private _clearTimeouts;
}
export default WebsocketReconnect;

export { }
