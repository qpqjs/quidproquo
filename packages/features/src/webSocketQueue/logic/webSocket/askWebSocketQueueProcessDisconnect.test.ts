import { ContextActionType, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askWebSocketQueueProcessDisconnect } from './askWebSocketQueueProcessDisconnect';

describe('askWebSocketQueueProcessDisconnect', () => {
  it('deletes the connection record and every subscription filed for the connection', () => {
    const deletes: [string, string, string | undefined][] = [];

    runStory(askWebSocketQueueProcessDisconnect('c1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: (action: any) => ({
        items:
          action.payload.keyValueStoreName === 'qpq-wsq-subs-demo'
            ? [
                { topic: 'scope#eventDoc#docs#1', connectionId: 'c1' },
                { topic: 'scope#eventDoc#docs#2', connectionId: 'c1' },
              ]
            : [],
      }),
      [KeyValueStoreActionType.Delete]: (action: any) => {
        deletes.push([action.payload.keyValueStoreName, action.payload.key, action.payload.sortKey]);
        return undefined;
      },
    });

    expect(deletes).toEqual([
      ['qpq-wsq-demo', 'c1', undefined],
      ['qpq-wsq-subs-demo', 'scope#eventDoc#docs#1', 'c1'],
      ['qpq-wsq-subs-demo', 'scope#eventDoc#docs#2', 'c1'],
    ]);
  });
});
