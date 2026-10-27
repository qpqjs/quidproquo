import { describe, expect, it } from 'vitest';

import { buildDynamoKey } from './buildDynamoKey';

describe('buildDynamoKey', () => {
  it('builds a partition-key-only key', () => {
    expect(buildDynamoKey('id', 'user-1')).toEqual({ id: { S: 'user-1' } });
  });

  it('includes the sort key when name and value are given', () => {
    expect(buildDynamoKey('id', 'user-1', 'version', 2)).toEqual({ id: { S: 'user-1' }, version: { N: '2' } });
  });

  it('includes falsy sort key values like 0 and the empty string', () => {
    expect(buildDynamoKey('id', 'user-1', 'version', 0)).toEqual({ id: { S: 'user-1' }, version: { N: '0' } });
    expect(buildDynamoKey('id', 'user-1', 'version', '')).toEqual({ id: { S: 'user-1' }, version: { S: '' } });
  });

  it('omits the sort key when it has no value', () => {
    expect(buildDynamoKey('id', 'user-1', 'version', undefined)).toEqual({ id: { S: 'user-1' } });
  });
});
