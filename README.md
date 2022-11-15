# websocket-reconnect

🚀 `websocket-reconnect-pro`。websocket 断开自动重连，基于原生`websocket`扩展实现、无依赖、TypeScript 编写、rollup 打包、单元测试。

[GitHub](https://github.com/chenchenwuai/websocket-reconnect)，如果帮助到了你，请给我一个 star~ 💖，如果你发现 bug，请尽情的提 issue 或者 pr，灰常感谢 💖

## 安装

[websocket-reconnect-pro](https://www.npmjs.com/package/websocket-reconnect-pro)

```bash
npm install websocket-reconnect-pro
```

## 使用

```javascript
// new WebsocketReconnect(url,protocols,options)

var url = "ws://192.168.1.100:8000";
var ws = new WebsocketReconnect(url, [], {
	minReconnectionDelay: 3000,
	reconnectionDelayGrowFactor: 1.1,
	enableHeartbeat: true,
	debug: true,
});
console.log(ws);

ws.onopen = function () {
	console.log("connect success");
	setTimeout(() => {
		ws.close();
	}, 3000);
};
ws.onclose = function (e) {
	console.log("onclose", e);
};
ws.onerror = function (e) {
	console.log("onerror", e);
};
ws.onmessage = function (e) {
	console.log(JSON.parse(e.data));
};
ws.onreconnect = function (e) {
	console.log("onreconnect", e);
};
```

## API

### 参数

#### `url`

url 是一个 websocket 地址字符串，或者是一个返回字符串的方法

```
url: string | (() => string) | (() => Promise<string>)
```

#### `protocols`

一个协议字符串或者一个包含协议字符串的数组。这些字符串用于指定子协议，这样单个服务器可以实现多个 WebSocket 子协议（例如，您可能希望一台服务器能够根据指定的协议（protocol）处理不同类型的交互）。如果不指定协议字符串，则假定为空字符串

#### `options`

| options 属性                | 说明                                                                       | 类型    | 可选值 | 默认值                       |
| --------------------------- | -------------------------------------------------------------------------- | ------- | ------ | ---------------------------- |
| WebSocket                   | 内部实例化的 WebSocket 类，默认为浏览器自带的`WebSocket`                   | Object  | -      | WebSocket                    |
| maxReconnectionDelay        | 最大重连时间间隔(毫秒)                                                     | number  | -      | 10000                        |
| minReconnectionDelay        | 最小重连时间间隔(毫秒)                                                     | number  | -      | 1000 + Math.random() \* 4000 |
| reconnectionDelayGrowFactor | 重连时间增长率,基数为 minReconnectionDelay,最大不超过 maxReconnectionDelay | number  | -      | 1.3                          |
| minUptime                   | -                                                                          | number  | -      | 5000                         |
| connectionTimeout           | 连接超时时间(毫秒)                                                         | number  | -      | 4000                         |
| maxRetries                  | 最大重连次数                                                               | number  | -      | Infinity                     |
| maxEnqueuedMessages         | 最大消息队列数量，重连后成功后会依次发送                                   | number  | -      | Infinity                     |
| autoSendQueueMessage        | 重连成功后是否自动发送队列中的消息                                         | boolean | -      | true                         |
| startClosed                 | 是否 new 之后不自动连接                                                    | boolean | -      | false                        |
| enableHeartbeat             | 是否开启心跳                                                               | boolean | -      | false                        |
| pingTimeout                 | 心跳发送时间间隔(毫秒)                                                     | number  | -      | 10000                        |
| pongTimeout                 | 心跳接受时间间隔(毫秒)                                                     | number  | -      | 10000                        |
| pingMsg                     | 心跳消息                                                                   | string  | -      | "\r\n"                       |
| outputPingMsg               | 心跳消息是否能被 onWCSStringMessage 方法输出                               | boolean | -      | false                        |
| debug                       | 开启 debug 模式                                                            | boolean | -      | false                        |

### 属性

除了 `WebSocket` 自带的[属性](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#properties)（`binaryType`,`readyState `等）以外，还有以下属性:

| 属性             | 说明                                                                                                                                       | 类型      | 备注       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| ws               | websocket 实例                                                                                                                             | WebSocket | 只读       |
| retryCount       | 当前失败重连的次数                                                                                                                         | Number    | 只读       |
| messageQueue     | 重连后需要发送的消息队列，当调用 send 方法时，内部的 websocket 还未建立，或者 websocket 的 readyState 不是 OPEN 时，会把消息 push 进此数组 | Array     | 可读、可写 |
| onreconnect      | 用于指定连接失败后的回调函数。                                                                                                             | Function  | 可读、可写 |
| onWebsocketError | 用于内部执行 new Websocket()时触发的错误回调函数。url 无法连接会触发此回调函数                                                             | Function  | 可读、可写 |

### 方法

除了 `WebSocket` 自带的[方法](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#methods)（`close`,`send `等）以外，还有以下属性:

| 方法      | 说明                                         | 参数 |
| --------- | -------------------------------------------- | ---- |
| reconnect | 主动调用重新连接方法，会重置 retryCount 为 0 | -    |

## 部分定义 .d.ts

```typescript
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
	private _nextConnectDelay;
	private readonly _url;
	private readonly _protocols;
	protected readonly _options: Required<Options>;
	constructor(
		url: UrlProvider,
		protocols?: string | string[],
		options?: Options
	);
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
	get ws(): WebSocket | undefined;
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
	onWebsocketError: ((error: unknown) => void) | null;
	close(code?: number, reason?: string): void;
	send(data: Message): void;
	addEventListener<T extends keyof WebSocketEventListenerMap>(
		type: T,
		listener: WebSocketEventListenerMap[T]
	): void;
	removeEventListener<T extends keyof WebSocketEventListenerMap>(
		type: T,
		listener: WebSocketEventListenerMap
	): void;
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
```

```typescript
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
	constructor(
		code: number | undefined,
		reason: string | undefined,
		target: any
	);
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
	error: Array<WebSocketEventListenerMap["error"]>;
	message: Array<WebSocketEventListenerMap["message"]>;
	open: Array<WebSocketEventListenerMap["open"]>;
	close: Array<WebSocketEventListenerMap["close"]>;
	reconnect: Array<WebSocketEventListenerMap["reconnect"]>;
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
export declare type UrlProvider =
	| string
	| (() => string)
	| (() => Promise<string>);
```
