import { ContextActionType, KeyValueStoreActionType, kvsEqual, kvsExists, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import {
  askDeleteByConnectionId,
  askGetAllConnections,
  askGetAllPagedConnections,
  askGetById,
  askGetConnectionsByUserId,
  askGetStoreName,
  askUpsert,
} from './connectionData';

const connection = { id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' } as const;

describe('askGetStoreName', () => {
  it('derives the store name from the override without reading context', () => {
    expect(runStory(askGetStoreName('myApi'))).toBe('qpq-wsq-myApi');
  });

  it('derives the store name from the connection-info api name', () => {
    const result = runStory(askGetStoreName(), {
      [ContextActionType.Read]: { apiName: 'demo' },
    });

    expect(result).toBe('qpq-wsq-demo');
  });
});

describe('askGetConnectionsByUserId', () => {
  it('queries the store by userId and returns the connections', () => {
    let captured: any;

    const result = runStory(askGetConnectionsByUserId('u1'), {
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

describe('askGetById', () => {
  it('returns the first connection matching the id', () => {
    let captured: any;

    const result = runStory(askGetById('c1'), {
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
    const result = runStory(askGetById('c1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: { items: [] },
    });

    expect(result).toBeUndefined();
  });
});

describe('askGetAllConnections', () => {
  it('scans the whole store and returns every connection', () => {
    const result = runStory(askGetAllConnections(), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Scan]: { items: [connection] },
    });

    expect(result).toEqual([connection]);
  });
});

describe('askGetAllPagedConnections', () => {
  it('filters by an existing userId when only authorized connections are wanted', () => {
    let captured: any;
    const page = { items: [connection], nextPageKey: 'next' };

    const result = runStory(askGetAllPagedConnections('demo', true, 'page-1'), {
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

    runStory(askGetAllPagedConnections('demo', false), {
      [KeyValueStoreActionType.Scan]: (action: any) => {
        captured = action;
        return { items: [] };
      },
    });

    expect(captured.payload.filterCondition).toBeUndefined();
  });
});

describe('askDeleteByConnectionId', () => {
  it('deletes the connection by id from the store', () => {
    let captured: any;

    runStory(askDeleteByConnectionId('c1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Delete]: (action: any) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured.payload.keyValueStoreName).toBe('qpq-wsq-demo');
    expect(captured.payload.key).toBe('c1');
  });
});

describe('askUpsert', () => {
  it('upserts the connection into the store', () => {
    let captured: any;

    runStory(askUpsert(connection), {
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
