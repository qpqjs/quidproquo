import { KeyValueStoreActionType, kvsExists, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askWebSocketQueueGetConnections } from './askWebSocketQueueGetConnections';

const connection = { id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' };

describe('askWebSocketQueueGetConnections', () => {
  it('returns the paged connections scanned from the api store', () => {
    let captured: any;
    const page = { items: [connection], nextPageKey: 'next' };

    const result = runStory(askWebSocketQueueGetConnections('demo', false, 'page-1'), {
      [KeyValueStoreActionType.Scan]: (action: any) => {
        captured = action;
        return page;
      },
    });

    expect(result).toEqual(page);
    expect(captured.payload.keyValueStoreName).toBe('qpq-wsq-demo');
    expect(captured.payload.filterCondition).toBeUndefined();
  });

  it('filters to authorized connections when requested', () => {
    let captured: any;

    runStory(askWebSocketQueueGetConnections('demo', true), {
      [KeyValueStoreActionType.Scan]: (action: any) => {
        captured = action;
        return { items: [] };
      },
    });

    expect(captured.payload.filterCondition).toEqual(kvsExists('userId'));
  });
});
