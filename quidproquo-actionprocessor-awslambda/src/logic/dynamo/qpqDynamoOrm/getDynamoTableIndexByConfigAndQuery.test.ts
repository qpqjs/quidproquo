import { KeyValueStoreQPQConfigSetting, KvsLogicalOperatorType, KvsQueryOperationType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getDynamoTableIndexByConfigAndQuery } from './getDynamoTableIndexByConfigAndQuery';

const setting = {
  partitionKey: { key: 'id', type: 'string' },
  sortKeys: [{ key: 'createdAt', type: 'string' }],
  indexes: [{ partitionKey: { key: 'email', type: 'string' } }],
} as unknown as KeyValueStoreQPQConfigSetting;

// pk userId / sk tenantId, with a GSI whose partition key IS the primary sort key
// (tenantId / userId) - the membership-table shape.
const mirroredSetting = {
  partitionKey: { key: 'userId', type: 'string' },
  sortKeys: [{ key: 'tenantId', type: 'string' }],
  indexes: [{ partitionKey: { key: 'tenantId', type: 'string' }, sortKey: { key: 'userId', type: 'string' } }],
} as unknown as KeyValueStoreQPQConfigSetting;

describe('getDynamoTableIndexByConfigAndQuery', () => {
  it('prefers the primary table when the query uses the sort key', () => {
    const query = { key: 'createdAt', operation: KvsQueryOperationType.GreaterThan, valueA: 0 };

    expect(getDynamoTableIndexByConfigAndQuery(setting, query)).toBeNull();
  });

  it('returns the GSI partition key when the query targets it', () => {
    const query = { key: 'email', operation: KvsQueryOperationType.Equal, valueA: 'a@b.com' };

    expect(getDynamoTableIndexByConfigAndQuery(setting, query)).toBe('email');
  });

  it('finds the GSI key nested inside a logical operator', () => {
    const query = {
      operation: KvsLogicalOperatorType.And,
      conditions: [{ key: 'email', operation: KvsQueryOperationType.Equal, valueA: 'a@b.com' }],
    };

    expect(getDynamoTableIndexByConfigAndQuery(setting, query)).toBe('email');
  });

  it('prefers the primary table when the query names the primary partition key, even if a GSI could serve it', () => {
    const query = {
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: 'userId', operation: KvsQueryOperationType.Equal, valueA: 'u1' },
        { key: 'tenantId', operation: KvsQueryOperationType.Equal, valueA: 't1' },
      ],
    };

    expect(getDynamoTableIndexByConfigAndQuery(mirroredSetting, query)).toBeNull();
  });

  it('routes to the GSI when the query names only the primary sort key and a GSI is partitioned on it', () => {
    // The regression: the primary table cannot serve a query without its partition
    // key ("Query condition missed key schema element"), so this MUST pick the GSI.
    const query = { key: 'tenantId', operation: KvsQueryOperationType.Equal, valueA: 't1' };

    expect(getDynamoTableIndexByConfigAndQuery(mirroredSetting, query)).toBe('tenantId');
  });

  it('returns null when no key matches the sort key or a GSI', () => {
    const query = { key: 'name', operation: KvsQueryOperationType.Equal, valueA: 'x' };

    expect(getDynamoTableIndexByConfigAndQuery(setting, query)).toBeNull();
  });
});
