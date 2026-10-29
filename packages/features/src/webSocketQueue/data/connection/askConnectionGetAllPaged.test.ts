import { KeyValueStoreActionType, kvsExists } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askConnectionGetAllPaged } from './askConnectionGetAllPaged';

const connection = { id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' } as const;

describe('askConnectionGetAllPaged', () => {
  it('filters by an existing userId when only authorized connections are wanted', () => {
    let captured: any;
    const page = { items: [connection], nextPageKey: 'next' };

    const result = runStory(askConnectionGetAllPaged('demo', true, 'page-1'), {
      [KeyValueStoreActionType.Scan]: (action: any) => {
        captured = action;
        return page;
      },
    });

    expect(result).toEqual(page);
    expect(captured.payload.keyValueStoreName).toBe('qpq-wsq-demo');
    expect(captured.payload.filterCondition).toEqual(kvsExists('userId'));
    expect(captured.payload.nextPageKey).toBe('page-1');
  });

  it('applies no filter when all connections are wanted', () => {
    let captured: any;

    runStory(askConnectionGetAllPaged('demo', false), {
      [KeyValueStoreActionType.Scan]: (action: any) => {
        captured = action;
        return { items: [] };
      },
    });

    expect(captured.payload.filterCondition).toBeUndefined();
  });
});
