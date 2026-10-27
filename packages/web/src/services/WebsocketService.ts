import { AnyEventMessage, Nullable } from 'quidproquo-core';

type WebSocketEventListenerFunction = (this: WebSocket, ev: Event) => void;

export enum WebsocketServiceEvent {
  OPEN = 'open',
  CLOSE = 'close',
  MESSAGE = 'message',
  ERROR = 'error',
}

export type SubscriptionHandle = {
  type: WebsocketServiceEvent;
};

export type WebSocketServiceSubscriptionFunction = (websocketService: WebsocketService, event?: Event) => void;

type SubscriptionMap = Map<SubscriptionHandle, WebSocketServiceSubscriptionFunction>;

type Subscriptions = {
  [key in WebsocketServiceEvent]: SubscriptionMap;
};

type WebsocketSendPayload = string | ArrayBufferLike | Blob | ArrayBufferView;

export type WebSocketServiceEventSubscriptionFunction<E extends AnyEventMessage> = (websocketService: WebsocketService, event: E) => void;

/**
 * Browser WebSocket wrapper that reconnects automatically (exponential backoff
 * with jitter), queues sends while disconnected, and fans events out to
 * subscribers. Call destroy() to stop reconnecting and release the socket.
 */
export class WebsocketService {
  public readonly url: string;
  private socket: Nullable<WebSocket> = null;
  private eventListeners: Partial<Record<WebsocketServiceEvent, WebSocketEventListenerFunction[]>> = {};
  private isDestroyed: boolean = false;
  private pendingMessages: WebsocketSendPayload[] = [];

  private reconnectAttempts: number = 0;
  private static readonly BASE_RECONNECT_MS = 1000;
  private static readonly MAX_RECONNECT_MS = 60_000;

  private subscriptions: Subscriptions = {
    [WebsocketServiceEvent.OPEN]: new Map(),
    [WebsocketServiceEvent.CLOSE]: new Map(),
    [WebsocketServiceEvent.MESSAGE]: new Map(),
    [WebsocketServiceEvent.ERROR]: new Map(),
  };

  constructor(url: string) {
    this.url = url;

    this.connect();
  }

  public destroy() {
    this.isDestroyed = true;
    this.unsubscribeAll();
    this.socket?.close();
  }

  public close() {
    this.socket?.close();
  }

  public isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  public hasBeenDestroyed() {
    return this.isDestroyed;
  }

  public getSocket() {
    return this.socket;
  }

  public subscribe(subscriptionType: WebsocketServiceEvent, callback: WebSocketServiceSubscriptionFunction): SubscriptionHandle {
    const subscriptionHandle: SubscriptionHandle = {
      type: subscriptionType,
    };
    this.subscriptions[subscriptionType].set(subscriptionHandle, callback);

    return subscriptionHandle;
  }

  public subscribeToEvent<E extends AnyEventMessage>(
    subscriptionType: E['type'],
    callback: WebSocketServiceEventSubscriptionFunction<E>,
  ): SubscriptionHandle {
    // Forwards only MESSAGE frames that parse as json and carry the subscribed
    // type; anything else on the socket is some other protocol's traffic.
    const forwardMatchingMessage: WebSocketServiceSubscriptionFunction = (websocketService, event) => {
      if (!event) {
        return;
      }

      try {
        const parsedEvent: E = JSON.parse((event as MessageEvent).data);
        if (parsedEvent.type === subscriptionType) {
          callback(websocketService, parsedEvent);
        }
      } catch {
        // Not json: ignore.
      }
    };

    return this.subscribe(WebsocketServiceEvent.MESSAGE, forwardMatchingMessage);
  }

  public unsubscribe(subscriptionHandle: SubscriptionHandle) {
    this.subscriptions[subscriptionHandle.type].delete(subscriptionHandle);
  }

  public unsubscribeAll() {
    for (const subscriptionMap of Object.values(this.subscriptions)) {
      subscriptionMap.clear();
    }
  }

  private connect() {
    this.removeAllEventListeners();

    this.socket = new WebSocket(this.url);

    this.addEventListener(WebsocketServiceEvent.OPEN, this.onConnect.bind(this));
    this.addEventListener(WebsocketServiceEvent.CLOSE, this.onClose.bind(this));
    this.addEventListener(WebsocketServiceEvent.MESSAGE, this.onMessage.bind(this));
    this.addEventListener(WebsocketServiceEvent.ERROR, this.onError.bind(this));
  }

  private addEventListener(event: WebsocketServiceEvent, listener: WebSocketEventListenerFunction) {
    if (!this.socket) {
      return;
    }

    this.socket.addEventListener(event, listener);
    (this.eventListeners[event] ??= []).push(listener);
  }

  private removeAllEventListeners() {
    if (this.socket) {
      for (const [event, listeners] of Object.entries(this.eventListeners)) {
        for (const listener of listeners) {
          this.socket.removeEventListener(event, listener);
        }
      }
    }

    this.eventListeners = {};
  }

  private reconnectIfNotDestroyed() {
    const baseDelay = Math.min(WebsocketService.BASE_RECONNECT_MS * Math.pow(2, this.reconnectAttempts), WebsocketService.MAX_RECONNECT_MS);

    // Add jitter: ±25% of base delay to prevent thundering herd
    const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1);
    const delay = Math.max(0, baseDelay + jitter);

    this.reconnectAttempts++;

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.connect();
      }
    }, delay);
  }

  private onConnect() {
    this.reconnectAttempts = 0;
    this.notifySubscribers(WebsocketServiceEvent.OPEN);
    const messages = this.pendingMessages;
    this.pendingMessages = [];
    messages.forEach((message) => {
      this.send(message);
    });
  }

  private onClose() {
    this.removeAllEventListeners();
    this.reconnectIfNotDestroyed();
    this.notifySubscribers(WebsocketServiceEvent.CLOSE);
  }

  private onMessage(event: Event) {
    this.notifySubscribers(WebsocketServiceEvent.MESSAGE, event);
  }

  private onError(event: Event) {
    this.notifySubscribers(WebsocketServiceEvent.ERROR, event);
  }

  private notifySubscribers(subType: WebsocketServiceEvent, event?: Event) {
    this.subscriptions[subType].forEach((callback) => {
      callback(this, event);
    });
  }

  public send(data: WebsocketSendPayload) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      this.pendingMessages.push(data);
    }
  }

  public sendEvent<E extends AnyEventMessage>(event: E) {
    this.send(JSON.stringify(event));
  }
}
