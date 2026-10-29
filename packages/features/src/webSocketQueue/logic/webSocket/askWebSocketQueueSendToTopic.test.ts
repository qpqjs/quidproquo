import { KeyValueStoreActionType } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';
import { askWebsocketSendMessageBase, WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { askWebSocketQueueSendToTopic } from './askWebSocketQueueSendToTopic';

const message = { type: 'some-event' } as any;

describe('askWebSocketQueueSendToTopic', () => {
  it('sends to every connection subscribed to the scoped topic on the named api', () => {
    const queries: any[] = [];
    const sends: any[] = [];

    runStory(askWebSocketQueueSendToTopic('demo', 'TENANT#t1#eventDoc#docs#1', message), {
      [KeyValueStoreActionType.Query]: (action: any) => {
        queries.push([action.payload.keyValueStoreName, action.payload.keyCondition]);
        return {
          items: [
            { topic: 'TENANT#t1#eventDoc#docs#1', connectionId: 'a' },
            { topic: 'TENANT#t1#eventDoc#docs#1', connectionId: 'b' },
          ],
        };
      },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload);
        return undefined;
      },
    });

    expect(queries[0][0]).toBe('qpq-wsq-subs-demo');
    expect(queries[0][1]).toMatchObject({ key: 'topic', valueA: 'TENANT#t1#eventDoc#docs#1' });
    expect(sends.map((send) => [send.websocketApiName, send.connectionId, send.payload.type])).toEqual([
      ['demo', 'a', 'some-event'],
      ['demo', 'b', 'some-event'],
    ]);
  });

  it('drops a dead subscriber and keeps sending to the rest', () => {
    const sends: string[] = [];
    const deletes: any[] = [];

    runStory(askWebSocketQueueSendToTopic('demo', 'topic', message), {
      [KeyValueStoreActionType.Query]: (action: any) => {
        // The topic query lists subscribers; the cleanup query lists the dead connection's subscriptions.
        if (action.payload.keyCondition.key === 'topic') {
          return {
            items: [
              { topic: 'topic', connectionId: 'dead' },
              { topic: 'topic', connectionId: 'b' },
            ],
          };
        }
        return { items: [{ topic: 'topic', connectionId: 'dead' }] };
      },
      [KeyValueStoreActionType.Delete]: (action: any) => {
        deletes.push([action.payload.keyValueStoreName, action.payload.key]);
        return undefined;
      },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.connectionId);
        if (action.payload.connectionId === 'dead') {
          return throwsError(askWebsocketSendMessageBase.errorType.Disconnected, 'gone');
        }
        return undefined;
      },
    });

    expect(sends).toEqual(['dead', 'b']);
    expect(deletes).toEqual([
      ['qpq-wsq-demo', 'dead'],
      ['qpq-wsq-subs-demo', 'topic'],
    ]);
  });
});
