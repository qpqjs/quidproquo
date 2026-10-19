import { ConfigActionType, ContextActionType, EventBusActionType, KeyValueStoreActionType, runStory, UserDirectoryActionType } from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { WebSocketQueueClientMessageEventType, WebSocketQueueServerMessageEventType } from '../../types';
import { askProcessOnMessage } from './askProcessOnMessage';

const connection = { id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' };

const globalByKey = (values: Record<string, string>) => (action: any) => values[action.payload.globalName] ?? '';

describe('askProcessOnMessage', () => {
  it('routes a ping message to the pong reply', () => {
    const sends: any[] = [];

    runStory(askProcessOnMessage('c1', { type: WebSocketQueueClientMessageEventType.Ping } as any), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.payload.type);
        return undefined;
      },
    });

    expect(sends).toEqual([WebSocketQueueServerMessageEventType.Pong]);
  });

  it('routes an unauthenticate message to the unauthenticated reply', () => {
    const sends: any[] = [];

    runStory(askProcessOnMessage('c1', { type: WebSocketQueueClientMessageEventType.Unauthenticate } as any), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: { items: [connection] },
      [KeyValueStoreActionType.Upsert]: undefined,
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.payload.type);
        return undefined;
      },
    });

    expect(sends).toEqual([WebSocketQueueServerMessageEventType.Unauthenticated]);
  });

  it('routes an authenticate message with no token to the unauthenticated reply', () => {
    const sends: any[] = [];

    runStory(askProcessOnMessage('c1', { type: WebSocketQueueClientMessageEventType.Authenticate, payload: {} } as any), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: { items: [connection] },
      [KeyValueStoreActionType.Upsert]: undefined,
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.payload.type);
        return undefined;
      },
    });

    expect(sends).toEqual([WebSocketQueueServerMessageEventType.Unauthenticated]);
  });

  it('routes an authenticate message with a token to the authenticated reply', () => {
    const sends: any[] = [];

    runStory(
      askProcessOnMessage('c1', {
        type: WebSocketQueueClientMessageEventType.Authenticate,
        payload: { accessToken: 'token-1' },
      } as any),
      {
        [ContextActionType.Read]: { apiName: 'demo' },
        [KeyValueStoreActionType.Query]: (action: any) => ({ items: action.payload.keyValueStoreName === 'qpq-wsq-subs-demo' ? [] : [connection] }),
        [ConfigActionType.GetGlobal]: globalByKey({
          'qpq-wsq-kvs-name-demo': 'user-directory',
          'qpq-wsq-eb-name-demo': 'event-bus',
        }),
        [UserDirectoryActionType.SetAccessToken]: { userId: 'u1' },
        [KeyValueStoreActionType.Upsert]: undefined,
        [EventBusActionType.SendMessages]: undefined,
        [WebsocketActionType.SendMessage]: (action: any) => {
          sends.push(action.payload.payload.type);
          return undefined;
        },
      },
    );

    expect(sends).toEqual([WebSocketQueueServerMessageEventType.Authenticated]);
  });

  it('broadcasts an unknown message to the event bus', () => {
    let broadcast: any;

    runStory(askProcessOnMessage('c1', { type: 'custom/event', payload: { a: 1 }, correlationId: 'corr' } as any), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [ConfigActionType.GetGlobal]: globalByKey({ 'qpq-wsq-eb-name-demo': 'event-bus' }),
      [EventBusActionType.SendMessages]: (action: any) => {
        broadcast = action;
        return undefined;
      },
    });

    expect(broadcast.payload.eventBusName).toBe('event-bus');
    expect(broadcast.payload.eventBusMessages).toEqual([{ type: 'custom/event', payload: { a: 1 } }]);
    expect(broadcast.context?.['qpq-storage-scope']).toBeUndefined();
  });

  it('broadcasts a message on a tenant connection under the connection storage scope', () => {
    let broadcast: any;

    runStory(askProcessOnMessage('c1', { type: 'custom/event', payload: { a: 1 }, correlationId: 'corr' } as any), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: { items: [{ ...connection, accessToken: 'token-1', scope: 'tenant-a' }] },
      [ConfigActionType.GetGlobal]: globalByKey({
        'qpq-wsq-kvs-name-demo': 'user-directory',
        'qpq-wsq-eb-name-demo': 'event-bus',
      }),
      [UserDirectoryActionType.SetAccessToken]: { userId: 'u1' },
      [EventBusActionType.SendMessages]: (action: any) => {
        broadcast = action;
        return undefined;
      },
    });

    expect(broadcast.context?.['qpq-storage-scope']).toBe('tenant-a');
    expect(broadcast.payload.eventBusMessages).toEqual([{ type: 'custom/event', payload: { a: 1 } }]);
  });
});
