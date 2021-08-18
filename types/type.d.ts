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
    reconnectDelay: number;
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
    outputPingMsg?: boolean;
    debug?: boolean;
};
export declare type UrlProvider = string | (() => string) | (() => Promise<string>);
