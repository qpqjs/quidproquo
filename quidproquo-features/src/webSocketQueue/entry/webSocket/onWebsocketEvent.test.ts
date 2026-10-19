import { ConfigActionType, KeyValueStoreActionType, runStory } from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { WebSocketQueueClientMessageEventType, WebSocketQueueServerMessageEventType } from '../../types';
import { onConnect, onDisconnect, onMessage } from './onWebsocketEvent';

const baseEvent = {
  apiName: 'wsapi',
  connectionId: 'c1',
  requestTime: '2026-06-26',
  requestTimeEpoch: 1234,
  sourceIp: '1.1.1.1',
} as any;

describe('onConnect', () => {
  it('provides the connection info and upserts the new connection', () => {
    let captured: any;

    runStory(onConnect(baseEvent), {
      [ConfigActionType.GetGlobal]: '',
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured.payload.keyValueStoreName).toBe('qpq-wsq-wsapi');
    expect(captured.payload.item).toEqual({
      id: 'c1',
      requestTime: '2026-06-26',
      requestTimeEpoch: 1234,
      ip: '1.1.1.1',
    });
  });
});

describe('onDisconnect', () => {
  it('provides the connection info and deletes the connection', () => {
    let captured: any;

    runStory(onDisconnect(baseEvent), {
      [KeyValueStoreActionType.Query]: { items: [] },
      [KeyValueStoreActionType.Delete]: (action: any) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured.payload.keyValueStoreName).toBe('qpq-wsq-wsapi');
    expect(captured.payload.key).toBe('c1');
  });
});

describe('onMessage', () => {
  it('ignores events whose body is not a string', () => {
    const result = runStory(onMessage({ ...baseEvent, body: undefined }));

    expect(result).toBeUndefined();
  });

  it('decodes the body and processes the message', () => {
    const sends: any[] = [];

    runStory(
      onMessage({
        ...baseEvent,
        body: JSON.stringify({ type: WebSocketQueueClientMessageEventType.Ping, correlationId: 'x' }),
      }),
      {
        [WebsocketActionType.SendMessage]: (action: any) => {
          sends.push(action.payload.payload.type);
          return undefined;
        },
      },
    );

    expect(sends).toEqual([WebSocketQueueServerMessageEventType.Pong]);
  });
});
