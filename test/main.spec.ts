// @ts-ignore
import WebSocket from 'ws';
import ReconnectingWebSocket, {ErrorEvent} from '../src';
import {spawn} from 'child_process';

const PORT = 50123;
const PORT_UNRESPONSIVE = '50124';
const URL = `ws://localhost:${PORT}`;

beforeEach(() => {
    (global as any).WebSocket = WebSocket;
});

afterEach(() => {
    delete (global as any).WebSocket;
    jest.restoreAllMocks();
});

test('throws with invalid constructor', () => {
    delete (global as any).WebSocket;
    expect(() => {
        new ReconnectingWebSocket(URL, undefined, {WebSocket: 123, maxRetries: 0});
    }).toThrow();
});

test('throws with missing constructor', () => {
    delete (global as any).WebSocket;
    expect(() => {
        new ReconnectingWebSocket(URL, undefined, {maxRetries: 0});
    }).toThrow();
});

test('throws with non-constructor object', () => {
    (global as any).WebSocket = {};
    expect(() => {
        new ReconnectingWebSocket(URL, undefined, {maxRetries: 0});
    }).toThrow();
});

test('throws if not created with `new`', () => {
    expect(() => {
        // @ts-ignore
        ReconnectingWebSocket(URL, undefined);
    }).toThrow(TypeError);
});

test('global WebSocket is used if available', done => {
    // @ts-ignore
    const ws = new ReconnectingWebSocket(URL, undefined, {WebSocket, maxRetries: 0});
    ws.onerror = () => {
        // @ts-ignore
        expect(ws._ws instanceof WebSocket).toBe(true);
        done();
    };
});

test('getters when not ready', done => {
    const ws = new ReconnectingWebSocket(URL, undefined, {
        maxRetries: 0,
    });
    expect(ws.bufferedAmount).toBe(0);
    expect(ws.protocol).toBe('');
    expect(ws.url).toBe('');
    expect(ws.extensions).toBe('');
    expect(ws.binaryType).toBe('blob');

    ws.onerror = () => {
        done();
    };
});

test('debug on', done => {
    const logSpy = jest.spyOn(console, 'log').mockReturnValue();

    const ws = new ReconnectingWebSocket(URL, undefined, {maxRetries: 0, debug: true});

    ws.onerror = () => {
        expect(logSpy).toHaveBeenCalledWith('WSR', 'connect', 0);
        done();
    };
});

test('debug off', done => {
    const logSpy = jest.spyOn(console, 'log').mockReturnValue();

    const ws = new ReconnectingWebSocket(URL, undefined, {maxRetries: 0});

    ws.onerror = () => {
        expect(logSpy).not.toHaveBeenCalled();
        done();
    };
});

test('pass WebSocket via options', done => {
    delete (global as any).WebSocket;
    const ws = new ReconnectingWebSocket(URL, undefined, {
        WebSocket,
        maxRetries: 0,
    });
    ws.onerror = () => {
        // @ts-ignore - accessing private property
        expect(ws._ws instanceof WebSocket).toBe(true);
        done();
    };
});

test('URL provider', async () => {
    const url = 'example.com';
    const ws = new ReconnectingWebSocket(URL, undefined, {maxRetries: 0});

    // @ts-ignore - accessing private property
    expect(await ws._getNextUrl(url)).toBe(url);

    // @ts-ignore - accessing private property
    expect(await ws._getNextUrl(() => url)).toBe(url);

    // @ts-ignore - accessing private property
    expect(await ws._getNextUrl(() => Promise.resolve(url))).toBe(url);

    // @ts-ignore - accessing private property
    expect(() => ws._getNextUrl(123)).toThrow();

    // @ts-ignore - accessing private property
    expect(() => ws._getNextUrl(() => 123)).toThrow();
});

test('connection status constants', () => {
    const ws = new ReconnectingWebSocket(URL, undefined, {maxRetries: 0});

    expect(ws.CONNECTING).toBe(0);
    expect(ws.OPEN).toBe(1);
    expect(ws.CLOSING).toBe(2);
    expect(ws.CLOSED).toBe(3);
    ws.close();
});

const maxRetriesTest = (count: number, done: () => void) => {
    const ws = new ReconnectingWebSocket(URL, undefined, {
        maxRetries: count,
        maxReconnectionDelay: 200,
    });

    ws.addEventListener('error', () => {
        if (ws.retryCount === count) {
            setTimeout(done, 500);
        }
        if (ws.retryCount > count) {
            throw Error(`too many retries: ${ws.retryCount}`);
        }
    });
};

test('max retries: 0', done => maxRetriesTest(0, done));
test('max retries: 1', done => maxRetriesTest(1, done));
test('max retries: 5', done => maxRetriesTest(5, done));

test('level0 event listeners are kept after reconnect', done => {
    const ws = new ReconnectingWebSocket(URL, undefined, {
        maxRetries: 4,
        reconnectionDelayGrowFactor: 1.2,
        maxReconnectionDelay: 20,
        minReconnectionDelay: 10,
    });

    const handleOpen = () => undefined;
    const handleClose = () => undefined;
    const handleMessage = () => undefined;
    const handleError = () => {
        expect(ws.onopen).toBe(handleOpen);
        expect(ws.onclose).toBe(handleClose);
        expect(ws.onmessage).toBe(handleMessage);
        expect(ws.onerror).toBe(handleError);
        if (ws.retryCount === 4) {
            done();
        }
    };

    ws.onopen = handleOpen;
    ws.onclose = handleClose;
    ws.onmessage = handleMessage;
    ws.onerror = handleError;
});

test('immediately-failed connection with 0 maxRetries must not retry', done => {
    const ws = new ReconnectingWebSocket('ws://255.255.255.255', [], {
        maxRetries: 0,
        connectionTimeout: 2000,
        minReconnectionDelay: 100,
        maxReconnectionDelay: 200,
    });

    let i = 0;
    ws.addEventListener('error', err => {
        i++;
        if (err.message === 'TIMEOUT') {
            throw Error('error');
        }
        if (i > 1) {
            throw Error('error');
        }
        setTimeout(() => {
            done();
        }, 2100);
    });
});

test('enqueue messages', done => {
    const ws = new ReconnectingWebSocket(URL, undefined, {
        maxRetries: 0,
    });
    const count = 10;
    const message = 'message';
    for (let i = 0; i < count; i++) ws.send(message);

    ws.onerror = () => {
        expect(ws.bufferedAmount).toBe(message.length * count);
        done();
    };
});

test('respect maximum enqueued messages', done => {
    const queueSize = 2;
    const ws = new ReconnectingWebSocket(URL, undefined, {
        maxRetries: 0,
        maxEnqueuedMessages: queueSize,
    });
    const count = 10;
    const message = 'message';
    for (let i = 0; i < count; i++) ws.send(message);

    ws.onerror = () => {
        expect(ws.bufferedAmount).toBe(message.length * queueSize);
        done();
    };
});
