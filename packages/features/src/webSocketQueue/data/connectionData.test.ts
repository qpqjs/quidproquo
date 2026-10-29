import { ContextActionType, KeyValueStoreActionType, kvsEqual, kvsExists } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import {
  askConnectionDeleteByConnectionId,
  askConnectionGetAll,
  askConnectionGetAllPaged,
  askConnectionGetById,
  askConnectionGetByUserId,
  askConnectionGetStoreName,
  askConnectionUpsert,
} from './connectionData';

const connection = { id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' } as const;

describe('askConnectionGetStoreName', () => {
  it('derives the store name from the override without reading context', () => {
    expect(runStory(askConnectionGetStoreName('myApi'))).toBe('qpq-wsq-myApi');
  });

  it('derives the store name from the connection-info api name', () => {
    const result = runStory(askConnectionGetStoreName(), {
      [ContextActionType.Read]: { apiName: 'demo' },
    });

    expect(result).toBe('qpq-wsq-demo');
  });
});

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

describe('askConnectionGetAll', () => {
  it('scans the whole store and returns every connection', () => {
    const result = runStory(askConnectionGetAll(), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Scan]: { items: [connection] },
    });

    expect(result).toEqual([connection]);
  });
});

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

describe('askConnectionDeleteByConnectionId', () => {
  it('deletes the connection by id from the store', () => {
    let captured: any;

    runStory(askConnectionDeleteByConnectionId('c1'), {
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
