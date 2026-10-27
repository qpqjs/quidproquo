import { describe, expect, it } from 'vitest';

import { KvsLogicalOperatorType, KvsQueryOperationType } from '../../actions/keyValueStore/types';
import { defineKeyValueStore } from '../../config';
import { KvsIndexNotFoundError } from './KvsIndexNotFoundError';
import { resolveKvsQueryIndex } from './resolveKvsQueryIndex';

const store = defineKeyValueStore<{ id: string; createdAt: string; email: string }>('users', 'id', ['createdAt'], { indexes: ['email'] });

// pk userId / sk tenantId, with a GSI whose partition key IS the primary sort key
// (tenantId / userId) - the membership-table shape.
const mirroredStore = defineKeyValueStore<{ userId: string; tenantId: string }>('memberships', 'userId', ['tenantId'], {
  indexes: [{ partitionKey: 'tenantId', sortKey: 'userId' }],
});

// GSIs sharing the table pk, sorted differently - the eventDoc summary shape, plus a named second one.
const summaryStore = defineKeyValueStore<{ type: string; id: string; createdAt: string; updatedAt: string }>('summaries', 'type', ['id'], {
  indexes: [
    { partitionKey: 'type', sortKey: 'updatedAt' },
    { name: 'typeByCreated', partitionKey: 'type', sortKey: 'createdAt' },
  ],
});

describe('resolveKvsQueryIndex', () => {
  it('prefers the table when the query uses the sort key', () => {
    const query = { key: 'createdAt', operation: KvsQueryOperationType.GreaterThan, valueA: 0 };

    expect(resolveKvsQueryIndex(store, query)).toBeNull();
  });

  it('returns the GSI whose partition key the query targets', () => {
    const query = { key: 'email', operation: KvsQueryOperationType.Equal, valueA: 'a@b.com' };

    expect(resolveKvsQueryIndex(store, query)).toBe(store.indexes[0]);
  });

  it('finds the GSI key nested inside a logical operator', () => {
    const query = {
      operation: KvsLogicalOperatorType.And,
      conditions: [{ key: 'email', operation: KvsQueryOperationType.Equal, valueA: 'a@b.com' }],
    };

    expect(resolveKvsQueryIndex(store, query)).toBe(store.indexes[0]);
  });

  it('prefers the table when the query names the table partition key, even if a GSI could serve it', () => {
    const query = {
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: 'userId', operation: KvsQueryOperationType.Equal, valueA: 'u1' },
        { key: 'tenantId', operation: KvsQueryOperationType.Equal, valueA: 't1' },
      ],
    };

    expect(resolveKvsQueryIndex(mirroredStore, query)).toBeNull();
  });

  it('routes to the GSI when the query names only the table sort key and a GSI is partitioned on it', () => {
    // The table cannot serve a query without its partition key ("Query condition missed key schema
    // element"), so this MUST pick the GSI.
    const query = { key: 'tenantId', operation: KvsQueryOperationType.Equal, valueA: 't1' };

    expect(resolveKvsQueryIndex(mirroredStore, query)).toBe(mirroredStore.indexes[0]);
  });

  it('returns null when no key matches the table partition key or a GSI', () => {
    const query = { key: 'name', operation: KvsQueryOperationType.Equal, valueA: 'x' };

    expect(resolveKvsQueryIndex(store, query)).toBeNull();
  });

  it('forces a named GSI, including one sharing the table partition key', () => {
    const query = { key: 'type', operation: KvsQueryOperationType.Equal, valueA: 'doc' };

    expect(resolveKvsQueryIndex(summaryStore, query)).toBeNull();
    expect(resolveKvsQueryIndex(summaryStore, query, 'type')).toBe(summaryStore.indexes[0]);
  });

  it('forces an index by its explicit name', () => {
    const query = { key: 'type', operation: KvsQueryOperationType.Equal, valueA: 'doc' };

    expect(resolveKvsQueryIndex(summaryStore, query, 'typeByCreated')).toBe(summaryStore.indexes[1]);
  });

  it("picks the GSI whose sort key the condition names when the table's keys don't cover it", () => {
    const byUpdated = {
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: 'type', operation: KvsQueryOperationType.Equal, valueA: 'doc' },
        { key: 'updatedAt', operation: KvsQueryOperationType.GreaterThan, valueA: '2026-01-01' },
      ],
    };
    const byCreated = {
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: 'type', operation: KvsQueryOperationType.Equal, valueA: 'doc' },
        { key: 'createdAt', operation: KvsQueryOperationType.GreaterThan, valueA: '2026-01-01' },
      ],
    };

    expect(resolveKvsQueryIndex(summaryStore, byUpdated)).toBe(summaryStore.indexes[0]);
    expect(resolveKvsQueryIndex(summaryStore, byCreated)).toBe(summaryStore.indexes[1]);
  });

  it('throws the typed error for an undeclared index name', () => {
    const query = { key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'u1' };

    expect(() => resolveKvsQueryIndex(store, query, 'missing')).toThrow(KvsIndexNotFoundError);
  });
});
