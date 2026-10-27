import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WebsocketService, WebsocketServiceEvent } from './WebsocketService';

class FakeWebSocket {
  static readonly OPEN = 1;
  static readonly CLOSED = 3;

  public readyState = FakeWebSocket.OPEN;
  public closed = false;
  public readonly sent: unknown[] = [];
  private readonly listeners: Record<string, ((event: unknown) => void)[]> = {};

  static instances: FakeWebSocket[] = [];

  constructor(public readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, cb: (event: unknown) => void) {
    (this.listeners[type] ||= []).push(cb);
  }

  removeEventListener(type: string, cb: (event: unknown) => void) {
    this.listeners[type] = (this.listeners[type] || []).filter((listener) => listener !== cb);
  }

  send(data: unknown) {
    this.sent.push(data);
  }

  close() {
    this.closed = true;
  }

  emit(type: WebsocketServiceEvent, event?: unknown) {
    (this.listeners[type] || []).forEach((cb) => cb.call(this, event));
  }
}

beforeEach(() => {
  FakeWebSocket.instances = [];
  vi.stubGlobal('WebSocket', FakeWebSocket);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const lastSocket = () => FakeWebSocket.instances[FakeWebSocket.instances.length - 1];

describe('WebsocketService', () => {
  it('connects to the url on construction', () => {
    const service = new WebsocketService('wss://example.com');

    expect(service.url).toBe('wss://example.com');
    expect(service.getSocket()).toBe(lastSocket());
    expect(lastSocket().url).toBe('wss://example.com');
  });

  it('reports connection state from the socket readyState', () => {
    const service = new WebsocketService('wss://example.com');

    expect(service.isConnected()).toBe(true);

    lastSocket().readyState = FakeWebSocket.CLOSED;
    expect(service.isConnected()).toBe(false);
  });

  it('notifies subscribers when the socket opens', () => {
    const service = new WebsocketService('wss://example.com');
    const onOpen = vi.fn();
    service.subscribe(WebsocketServiceEvent.OPEN, onOpen);

    lastSocket().emit(WebsocketServiceEvent.OPEN);

    expect(onOpen).toHaveBeenCalledWith(service, undefined);
  });

  it('stops notifying after unsubscribe', () => {
    const service = new WebsocketService('wss://example.com');
    const onOpen = vi.fn();
    const handle = service.subscribe(WebsocketServiceEvent.OPEN, onOpen);

    service.unsubscribe(handle);
    lastSocket().emit(WebsocketServiceEvent.OPEN);

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('clears every subscription on unsubscribeAll', () => {
    const service = new WebsocketService('wss://example.com');
    const onOpen = vi.fn();
    const onError = vi.fn();
    service.subscribe(WebsocketServiceEvent.OPEN, onOpen);
    service.subscribe(WebsocketServiceEvent.ERROR, onError);

    service.unsubscribeAll();
    lastSocket().emit(WebsocketServiceEvent.OPEN);
    lastSocket().emit(WebsocketServiceEvent.ERROR);

    expect(onOpen).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('sends immediately while the socket is open', () => {
    const service = new WebsocketService('wss://example.com');

    service.send('hello');

    expect(lastSocket().sent).toEqual(['hello']);
  });

  it('queues messages while closed and flushes them once open', () => {
    const service = new WebsocketService('wss://example.com');
    lastSocket().readyState = FakeWebSocket.CLOSED;

    service.send('queued');
    expect(lastSocket().sent).toEqual([]);

    lastSocket().readyState = FakeWebSocket.OPEN;
    lastSocket().emit(WebsocketServiceEvent.OPEN);

    expect(lastSocket().sent).toEqual(['queued']);
  });

  it('serialises events through sendEvent', () => {
    const service = new WebsocketService('wss://example.com');
    const event = { type: 'ping', payload: { id: 1 } };

    service.sendEvent(event as never);

    expect(lastSocket().sent).toEqual([JSON.stringify(event)]);
  });

  it('routes matching messages to typed event subscribers', () => {
    const service = new WebsocketService('wss://example.com');
    const onPing = vi.fn();
    service.subscribeToEvent<{ type: 'ping' }>('ping', onPing);

    lastSocket().emit(WebsocketServiceEvent.MESSAGE, { data: JSON.stringify({ type: 'ping', n: 1 }) });

    expect(onPing).toHaveBeenCalledWith(service, { type: 'ping', n: 1 });
  });

  it('ignores typed messages of a different type or invalid json', () => {
    const service = new WebsocketService('wss://example.com');
    const onPing = vi.fn();
    service.subscribeToEvent<{ type: 'ping' }>('ping', onPing);

    lastSocket().emit(WebsocketServiceEvent.MESSAGE, { data: JSON.stringify({ type: 'pong' }) });
    lastSocket().emit(WebsocketServiceEvent.MESSAGE, { data: 'not-json' });
    lastSocket().emit(WebsocketServiceEvent.MESSAGE, undefined);

    expect(onPing).not.toHaveBeenCalled();
  });

  it('notifies error subscribers with the event', () => {
    const service = new WebsocketService('wss://example.com');
    const onError = vi.fn();
    const errorEvent = { message: 'bad' };
    service.subscribe(WebsocketServiceEvent.ERROR, onError);

    lastSocket().emit(WebsocketServiceEvent.ERROR, errorEvent);

    expect(onError).toHaveBeenCalledWith(service, errorEvent);
  });

  it('reconnects after the socket closes', () => {
    vi.useFakeTimers();
    new WebsocketService('wss://example.com');
    const first = lastSocket();

    first.emit(WebsocketServiceEvent.CLOSE);
    vi.runOnlyPendingTimers();

    expect(FakeWebSocket.instances.length).toBe(2);
  });

  it('does not reconnect once destroyed', () => {
    vi.useFakeTimers();
    const service = new WebsocketService('wss://example.com');
    const first = lastSocket();

    service.destroy();
    first.emit(WebsocketServiceEvent.CLOSE);
    vi.runOnlyPendingTimers();

    expect(service.hasBeenDestroyed()).toBe(true);
    expect(first.closed).toBe(true);
    expect(FakeWebSocket.instances.length).toBe(1);
  });

  it('closes the underlying socket on close', () => {
    const service = new WebsocketService('wss://example.com');

    service.close();

    expect(lastSocket().closed).toBe(true);
  });
});
