# websocket-reconnect

🚀 websocket reconnect 🌈.

## usage
```js
/**
 * @params url => string | (() => string) | (() => Promise<string>)
 * @params protocols  =>  WebSocket prototols, optional (DOMString or sequence<DOMString>)
 * @params options => Options
 * {
 * 	WebSocket?: any
 * 	maxReconnectionDelay?: number
 * 	minReconnectionDelay?: number
 * 	reconnectionDelayGrowFactor?: number
 * 	minUptime?: number
 * 	connectionTimeout?: number
 * 	maxRetries?: number
 * 	maxEnqueuedMessages?: number
 * 	startClosed?: boolean
 * 	debug?: boolean
 * }
 */
const wsr = new WebsocketReconnect(url,protocols,options)
```
