import { ContextActionType, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askConnectionUpsert } from './askConnectionUpsert';

const connection = { id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' } as const;

describe('askConnectionUpsert', () => {
  it('upserts the connection into the store', () => {
    let captured: any;

    runStory(askConnectionUpsert(connection), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured.payload.keyValueStoreName).toBe('qpq-wsq-demo');
    expect(captured.payload.item).toEqual(connection);
  });
});
