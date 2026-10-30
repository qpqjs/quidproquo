import { ContextActionType, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { Connection, WebSocketQueueClientMessageEventType } from '../../../types';
import { askWebSocketQueueProcessUnsubscribe, isWebSocketUnsubscribeMessage } from './askWebSocketQueueProcessUnsubscribe';

const connection: Connection = { id: 'c1', requestTime: '', requestTimeEpoch: 0, ip: '', userId: 'u1', scope: 'TENANT#t1' };

describe('isWebSocketUnsubscribeMessage', () => {
  it('accepts an unsubscribe message only', () => {
    expect(isWebSocketUnsubscribeMessage({ type: WebSocketQueueClientMessageEventType.Unsubscribe } as any)).toBe(true);
    expect(isWebSocketUnsubscribeMessage({ type: WebSocketQueueClientMessageEventType.Subscribe } as any)).toBe(false);
  });
});

describe('askWebSocketQueueProcessUnsubscribe', () => {
  it("deletes the subscription under the connection's own scope", () => {
    const deletes: any[] = [];

    runStory(askWebSocketQueueProcessUnsubscribe(connection, 'eventDoc#docs#1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Delete]: (action: any) => {
        deletes.push([action.payload.keyValueStoreName, action.payload.key, action.payload.sortKey]);
        return undefined;
      },
    });

    expect(deletes).toEqual([['qpq-wsq-subs-demo', 'TENANT#t1#eventDoc#docs#1', 'c1']]);
  });

  it('does nothing for an unknown connection', () => {
    const deletes: any[] = [];

    runStory(askWebSocketQueueProcessUnsubscribe(null, 'eventDoc#docs#1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Delete]: () => {
        deletes.push(true);
        return undefined;
      },
    });

    expect(deletes).toEqual([]);
  });
});
