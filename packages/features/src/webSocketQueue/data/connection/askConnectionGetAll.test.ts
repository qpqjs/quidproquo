import { ContextActionType, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askConnectionGetAll } from './askConnectionGetAll';

const connection = { id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' } as const;

describe('askConnectionGetAll', () => {
  it('scans the whole store and returns every connection', () => {
    const result = runStory(askConnectionGetAll(), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Scan]: { items: [connection] },
    });

    expect(result).toEqual([connection]);
  });
});
