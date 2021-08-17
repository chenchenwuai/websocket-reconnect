/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
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
export type ReconnectEventParams = {
	maxRetries: number,
	reconnectDelay: number,
	retryCount: number
}
export interface WebSocketEventMap {
	close: CloseEvent;
	error: ErrorEvent;
	message: MessageEvent;
	open: Event;
	reconnect: ReconnectEventParams;
}
export interface WebSocketEventListenerMap {
	close: (event: CloseEvent) => void | {handleEvent: (event: CloseEvent) => void};
	error: (event: ErrorEvent) => void | {handleEvent: (event: ErrorEvent) => void};
	message: (event: MessageEvent) => void | {handleEvent: (event: MessageEvent) => void};
	open: (event: Event) => void | {handleEvent: (event: Event) => void};
	reconnect: (options: ReconnectEventParams) => void;
}
export type ListenersMap = {
	error: Array<WebSocketEventListenerMap['error']>;
	message: Array<WebSocketEventListenerMap['message']>;
	open: Array<WebSocketEventListenerMap['open']>;
	close: Array<WebSocketEventListenerMap['close']>;
	reconnect: Array<WebSocketEventListenerMap['reconnect']>;
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
	enableHeartbeat?: boolean,
	pingTimeout?: number,
	pongTimeout?: number,
	pingMsg?: Message,
	debug?: boolean
}
export type UrlProvider = string | (() => string) | (() => Promise<string>)
