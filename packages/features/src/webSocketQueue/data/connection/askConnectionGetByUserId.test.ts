import { ContextActionType, KeyValueStoreActionType, kvsEqual } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askConnectionGetByUserId } from './askConnectionGetByUserId';

const connection = { id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' } as const;

describe('askConnectionGetByUserId', () => {
  it('queries the store by userId and returns the connections', () => {
    let captured: any;

    const result = runStory(askConnectionGetByUserId('u1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: (action: any) => {
        captured = action;
        return { items: [connection] };
      },
    });

    expect(result).toEqual([connection]);
    expect(captured.payload.keyValueStoreName).toBe('qpq-wsq-demo');
    expect(captured.payload.keyCondition).toEqual(kvsEqual('userId', 'u1'));
  });
});
