/*!
 *  websocket-reconnect v1.0.5
 *  (c) 2020-2021 chenwuai
 * Released under the MIT License.
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

/** @deprecated */
function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

var Event = function () {
  function Event(type, target) {
    this.target = target;
    this.type = type;
  }

  return Event;
}();

var ErrorEvent = function (_super) {
  __extends(ErrorEvent, _super);

  function ErrorEvent(error, target) {
    var _this = _super.call(this, 'error', target) || this;

    _this.message = error.message;
    _this.error = error;
    return _this;
  }

  return ErrorEvent;
}(Event);

var CloseEvent = function (_super) {
  __extends(CloseEvent, _super);

  function CloseEvent(code, reason, target) {
    if (code === void 0) {
      code = 1000;
    }

    if (reason === void 0) {
      reason = '';
    }

    var _this = _super.call(this, 'close', target) || this;

    _this.wasClean = true;
    _this.code = code;
    _this.reason = reason;
    return _this;
  }

  return CloseEvent;
}(Event);
var DEFAULT = {
  maxReconnectionDelay: 10000,
  minReconnectionDelay: 1000 + Math.random() * 4000,
  minUptime: 5000,
  reconnectionDelayGrowFactor: 1.3,
  connectionTimeout: 4000,
  maxRetries: Infinity,
  maxEnqueuedMessages: Infinity,
  startClosed: false,
  enableHeartbeat: false,
  pingTimeout: 10000,
  pongTimeout: 10000,
  pingMsg: '\r\n',
  debug: false
};

var getGlobalWebSocket = function getGlobalWebSocket() {
  if (typeof WebSocket !== 'undefined') {
    return WebSocket;
  }
};

var isWebSocket = function isWebSocket(w) {
  return typeof w !== 'undefined' && !!w && w.CLOSING === 2;
};

var WebsocketReconnect = function () {
  function WebsocketReconnect(url, protocols, options) {
    var _this = this;

    if (options === void 0) {
      options = {};
    }

    this._binaryType = 'blob';
    this._messageQueue = [];
    this._listeners = {
      error: [],
      message: [],
      open: [],
      close: []
    };
    this._retryCount = -1;
    this._shouldReconnect = true;
    this._connectLock = false;
    this._closeCalled = false;
    this._pingIntervalId = 0;
    this._pongTimeoutId = 0;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this.onopen = null;

    this._handleOpen = function (event) {
      _this._debug('open event');

      var _a = _this._options.minUptime,
          minUptime = _a === void 0 ? DEFAULT.minUptime : _a;
      clearTimeout(_this._connectTimeout);
      _this._uptimeTimeout = setTimeout(function () {
        return _this._acceptOpen();
      }, minUptime);

      if (_this._ws) {
        _this._ws.binaryType = _this._binaryType;
      }

      _this._options.enableHeartbeat && _this._heartCheck();

      _this._messageQueue.forEach(function (message) {
        var _a;

        return (_a = _this._ws) === null || _a === void 0 ? void 0 : _a.send(message);
      });

      _this._messageQueue = [];

      if (_this.onopen) {
        _this.onopen(event);
      }

      _this._listeners.open.forEach(function (listener) {
        return _this._callEventListener(event, listener);
      });
    };

    this._handleMessage = function (event) {
      _this._debug('message event');

      if (_this.onmessage) {
        _this.onmessage(event);
      }

      _this._listeners.message.forEach(function (listener) {
        return _this._callEventListener(event, listener);
      });
    };

    this._handleClose = function (event) {
      _this._debug('close event');

      _this._clearTimeouts();

      if (_this._shouldReconnect) {
        _this._connect();
      }

      if (_this.onclose) {
        _this.onclose(event);
      }

      _this._listeners.close.forEach(function (listener) {
        return _this._callEventListener(event, listener);
      });
    };

    this._handleError = function (event) {
      _this._debug('error event', event.message);

      _this._disconnect(undefined, event.message === 'TIMEOUT' ? 'timeout' : undefined);

      if (_this.onerror) {
        _this.onerror(event);
      }

      _this._debug('exec error listeners');

      _this._listeners.error.forEach(function (listener) {
        return _this._callEventListener(event, listener);
      });

      _this._connect();
    };

    this._url = url;
    this._protocols = protocols !== null && protocols !== void 0 ? protocols : '';
    this._options = options;

    if (this._options.startClosed) {
      this._shouldReconnect = false;
    }

    this._connect();
  }

  Object.defineProperty(WebsocketReconnect.prototype, "binaryType", {
    get: function get() {
      return this._ws ? this._ws.binaryType : this._binaryType;
    },
    set: function set(value) {
      this._binaryType = value;

      if (this._ws) {
        this._ws.binaryType = value;
      }
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect.prototype, "retryCount", {
    get: function get() {
      return Math.max(this._retryCount, 0);
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect.prototype, "bufferedAmount", {
    get: function get() {
      var bytes = this._messageQueue.reduce(function (acc, message) {
        if (typeof message === 'string') {
          acc += message.length;
        } else if (message instanceof Blob) {
          acc += message.size;
        } else {
          acc += message.byteLength;
        }

        return acc;
      }, 0);

      return bytes + (this._ws ? this._ws.bufferedAmount : 0);
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect.prototype, "extensions", {
    get: function get() {
      return this._ws ? this._ws.extensions : '';
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect.prototype, "protocol", {
    get: function get() {
      return this._ws ? this._ws.protocol : '';
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect.prototype, "readyState", {
    get: function get() {
      if (this._ws) {
        return this._ws.readyState;
      }

      return this._options.startClosed ? WebSocket.CLOSED : WebSocket.CLOSING;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect.prototype, "url", {
    get: function get() {
      return this._ws ? this._ws.url : '';
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect, "CONNECTING", {
    get: function get() {
      return 0;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect, "OPEN", {
    get: function get() {
      return 1;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect, "CLOSING", {
    get: function get() {
      return 2;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect, "CLOSED", {
    get: function get() {
      return 3;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect.prototype, "CONNECTING", {
    get: function get() {
      return WebSocket.CONNECTING;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect.prototype, "OPEN", {
    get: function get() {
      return WebSocket.OPEN;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect.prototype, "CLOSING", {
    get: function get() {
      return WebSocket.CLOSING;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(WebsocketReconnect.prototype, "CLOSED", {
    get: function get() {
      return WebSocket.CLOSED;
    },
    enumerable: false,
    configurable: true
  });

  WebsocketReconnect.prototype.close = function (code, reason) {
    this._closeCalled = true;
    this._shouldReconnect = false;

    this._clearTimeouts();

    if (!this._ws) {
      this._debug('close enqueued: no ws instance');

      return;
    }

    if (this._ws.readyState === this.CLOSED) {
      this._debug('close: already closed');

      return;
    }

    this._ws.close(code, reason);
  };

  WebsocketReconnect.prototype.send = function (data) {
    if (this._ws && this._ws.readyState === this.OPEN) {
      this._debug('send', data);

      this._ws.send(data);
    } else {
      var _a = this._options.maxEnqueuedMessages,
          maxEnqueuedMessages = _a === void 0 ? DEFAULT.maxEnqueuedMessages : _a;

      if (this._messageQueue.length < maxEnqueuedMessages) {
        this._debug('enqueue', data);

        this._messageQueue.push(data);
      }
    }
  };

  WebsocketReconnect.prototype.addEventListener = function (type, listener) {
    if (this._listeners[type]) {
      this._listeners[type].push(listener);
    }
  };

  WebsocketReconnect.prototype.removeEventListener = function (type, listener) {
    if (this._listeners[type]) {
      this._listeners = this._listeners[type].filter(function (l) {
        return l !== listener;
      });
    }
  };

  WebsocketReconnect.prototype.dispatchEvent = function (event) {
    var e_1, _a;

    var listeners = this._listeners[event.type];

    if (listeners) {
      try {
        for (var listeners_1 = __values(listeners), listeners_1_1 = listeners_1.next(); !listeners_1_1.done; listeners_1_1 = listeners_1.next()) {
          var listener = listeners_1_1.value;

          this._callEventListener(event, listener);
        }
      } catch (e_1_1) {
        e_1 = {
          error: e_1_1
        };
      } finally {
        try {
          if (listeners_1_1 && !listeners_1_1.done && (_a = listeners_1["return"])) _a.call(listeners_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
    }

    return true;
  };

  WebsocketReconnect.prototype._callEventListener = function (event, listener) {
    if ('handleEvent' in listener) {
      listener.handleEvent(event);
    } else {
      listener(event);
    }
  };

  WebsocketReconnect.prototype.reconnect = function (code, reason) {
    this._shouldReconnect = true;
    this._closeCalled = false;
    this._retryCount = -1;

    if (!this._ws || this._ws.readyState === WebSocket.CLOSED) {
      this._connect();
    } else {
      this._disconnect(code, reason);

      this._connect();
    }
  };

  WebsocketReconnect.prototype._connect = function () {
    var _this = this;

    if (this._connectLock || !this._shouldReconnect) {
      return;
    }

    this._connectLock = true;
    var _a = this._options,
        _b = _a.maxRetries,
        maxRetries = _b === void 0 ? DEFAULT.maxRetries : _b,
        _c = _a.connectionTimeout,
        connectionTimeout = _c === void 0 ? DEFAULT.connectionTimeout : _c,
        _d = _a.WebSocket,
        WebSocket = _d === void 0 ? getGlobalWebSocket() : _d;

    if (this._retryCount >= maxRetries) {
      this._debug('max retries reached', this._retryCount, '>=', maxRetries);

      return;
    }

    this._retryCount++;

    this._debug('connect', this._retryCount);

    this._removeListeners();

    if (!isWebSocket(WebSocket)) {
      throw Error('No valid WebSocket class provided');
    }

    this._wait().then(function () {
      return _this._getNextUrl(_this._url);
    }).then(function (url) {
      if (_this._closeCalled) {
        return;
      }

      _this._debug('connect', {
        url: url,
        protocols: _this._protocols
      });

      _this._ws = _this._protocols ? new WebSocket(url, _this._protocols) : new WebSocket(url);
      _this._ws.binaryType = _this._binaryType;
      _this._connectLock = false;

      _this._addEventListeners();

      _this._connectTimeout = setTimeout(function () {
        return _this._handleTimeout();
      }, connectionTimeout);
    });
  };

  WebsocketReconnect.prototype._disconnect = function (code, reason) {
    if (code === void 0) {
      code = 1000;
    }

    this._clearTimeouts();

    if (!this._ws) {
      return;
    }

    this._removeListeners();

    try {
      this._ws.close(code, reason);

      this._handleClose(new CloseEvent(code, reason, this));
    } catch (error) {
      throw Error(error);
    }
  };

  WebsocketReconnect.prototype._wait = function () {
    var _this = this;

    return new Promise(function (resolve) {
      setTimeout(resolve, _this._getNextDelay());
    });
  };

  WebsocketReconnect.prototype._getNextDelay = function () {
    var _a = this._options,
        _b = _a.reconnectionDelayGrowFactor,
        reconnectionDelayGrowFactor = _b === void 0 ? DEFAULT.reconnectionDelayGrowFactor : _b,
        _c = _a.minReconnectionDelay,
        minReconnectionDelay = _c === void 0 ? DEFAULT.minReconnectionDelay : _c,
        _d = _a.maxReconnectionDelay,
        maxReconnectionDelay = _d === void 0 ? DEFAULT.maxReconnectionDelay : _d;
    var delay = 0;

    if (this._retryCount > 0) {
      delay = minReconnectionDelay * Math.pow(reconnectionDelayGrowFactor, this._retryCount);

      if (delay > maxReconnectionDelay) {
        delay = maxReconnectionDelay;
      }
    }

    this._debug('next delay', delay);

    return delay;
  };

  WebsocketReconnect.prototype._getNextUrl = function (urlProvider) {
    if (typeof urlProvider === 'string') {
      return Promise.resolve(urlProvider);
    } else if (typeof urlProvider === 'function') {
      var url = urlProvider();

      if (typeof url === 'string') {
        return Promise.resolve(url);
      }

      if (url.then !== undefined) {
        return url;
      }
    }

    throw Error('Invalid URL');
  };

  WebsocketReconnect.prototype._handleTimeout = function () {
    this._debug('timeout event');

    this._handleError(new ErrorEvent(Error('TIMEOUT'), this));
  };

  WebsocketReconnect.prototype._acceptOpen = function () {
    this._debug('accept open');

    this._retryCount = 0;
  };

  WebsocketReconnect.prototype._debug = function () {
    var args = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }

    if (this._options.debug) {
      console.log.apply(console, __spread(['WSR'], args));
    }
  };

  WebsocketReconnect.prototype._addEventListeners = function () {
    if (!this._ws) {
      return;
    }

    this._debug('addListeners');

    this._ws.addEventListener('open', this._handleOpen);

    this._ws.addEventListener('message', this._handleMessage);

    this._ws.addEventListener('close', this._handleClose);

    this._ws.addEventListener('error', this._handleError);
  };

  WebsocketReconnect.prototype._removeListeners = function () {
    if (!this._ws) {
      return;
    }

    this._ws.removeEventListener('open', this._handleOpen);

    this._ws.removeEventListener('message', this._handleMessage);

    this._ws.removeEventListener('close', this._handleClose);

    this._ws.removeEventListener('error', this._handleError);
  };

  WebsocketReconnect.prototype._heartCheck = function () {
    this._heartReset();

    this._heartStart();
  };

  WebsocketReconnect.prototype._heartStart = function () {
    var _this = this;

    var _a = this._options,
        _b = _a.enableHeartbeat,
        enableHeartbeat = _b === void 0 ? DEFAULT.enableHeartbeat : _b,
        _c = _a.pingTimeout,
        pingTimeout = _c === void 0 ? DEFAULT.pingTimeout : _c,
        _d = _a.pongTimeout,
        pongTimeout = _d === void 0 ? DEFAULT.pongTimeout : _d,
        _e = _a.pingMsg,
        pingMsg = _e === void 0 ? DEFAULT.pingMsg : _e;

    if (!this._shouldReconnect && !enableHeartbeat) {
      return;
    }

    this._pingIntervalId = setInterval(function () {
      _this._debug('ping');

      _this.send(pingMsg);

      _this._pongTimeoutId = setTimeout(function () {
        _this._debug('Pong Timeout');

        _this.close();
      }, pongTimeout);
    }, pingTimeout);
  };

  WebsocketReconnect.prototype._heartReset = function () {
    clearInterval(this._pingIntervalId);
    clearTimeout(this._pongTimeoutId);
  };

  WebsocketReconnect.prototype._clearTimeouts = function () {
    clearTimeout(this._connectTimeout);
    clearTimeout(this._uptimeTimeout);

    this._heartReset();
  };

  return WebsocketReconnect;
}();

exports.CloseEvent = CloseEvent;
exports.ErrorEvent = ErrorEvent;
exports.Event = Event;
exports.default = WebsocketReconnect;
