import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineKeyValueStore, kvsKey } from './keyValueStore';

describe('kvsKey', () => {
  it('defaults the type to string', () => {
    expect(kvsKey('id')).toEqual({ key: 'id', type: 'string' });
  });

  it('uses the given type', () => {
    expect(kvsKey('count', 'number')).toEqual({ key: 'count', type: 'number' });
  });
});

describe('defineKeyValueStore', () => {
  it('builds a KeyValueStore setting with the given name and defaults', () => {
    expect(defineKeyValueStore('Users', 'id')).toEqual({
      configSettingType: QPQCoreConfigSettingType.keyValueStore,
      uniqueKey: 'Users',
      keyValueStoreName: 'Users',
      partitionKey: { key: 'id', type: 'string' },
      sortKeys: [],
      indexes: [],
      global: false,
      owner: undefined,
      ttlAttribute: undefined,
      disablePointInTimeRecovery: false,
      cryptoKeyName: undefined,
      scoped: false,
    });
  });

  it('converts a string partition key to a string KvsKey', () => {
    expect(defineKeyValueStore('Users', 'id').partitionKey).toEqual({ key: 'id', type: 'string' });
  });

  it('converts string sort keys to string KvsKeys', () => {
    expect(defineKeyValueStore('Users', 'id', ['createdAt']).sortKeys).toEqual([{ key: 'createdAt', type: 'string' }]);
  });

  it('converts a bare string index to a partition-key-only KvsIndex and applies options', () => {
    const setting = defineKeyValueStore('Users', 'id', [], { indexes: ['email'], global: true, cryptoKeyName: 'main' });

    expect(setting.indexes).toEqual([{ partitionKey: { key: 'email', type: 'string' } }]);
    expect(setting.global).toBe(true);
    expect(setting.cryptoKeyName).toBe('main');
  });

  it('converts an object index with partition and sort keys, keeping explicit key types', () => {
    const setting = defineKeyValueStore('Users', 'id', [], {
      indexes: [{ partitionKey: { key: 'email', type: 'string' }, sortKey: 'createdAt' }],
    });

    expect(setting.indexes).toEqual([
      {
        partitionKey: { key: 'email', type: 'string' },
        sortKey: { key: 'createdAt', type: 'string' },
      },
    ]);
  });

  it('passes ttlAttribute through', () => {
    expect(defineKeyValueStore('Users', 'id', [], { ttlAttribute: 'expiresAt' }).ttlAttribute).toBe('expiresAt');
  });
});
