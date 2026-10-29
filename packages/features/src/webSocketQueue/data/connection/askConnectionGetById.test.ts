import { ContextActionType, KeyValueStoreActionType, kvsEqual } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askConnectionGetById } from './askConnectionGetById';

const connection = { id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' } as const;

describe('askConnectionGetById', () => {
  it('returns the first connection matching the id', () => {
    let captured: any;

    const result = runStory(askConnectionGetById('c1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: (action: any) => {
        captured = action;
        return { items: [connection] };
      },
    });

    expect(result).toEqual(connection);
    expect(captured.payload.keyCondition).toEqual(kvsEqual('id', 'c1'));
  });

  it('returns undefined when no connection matches', () => {
    const result = runStory(askConnectionGetById('c1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: { items: [] },
    });

    expect(result).toBeUndefined();
  });
});
