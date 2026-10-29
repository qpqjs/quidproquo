import { describe, expect, it } from 'vitest';

import { defineApplication } from '../../applicationName';
import { defineModule } from '../../moduleName';
import { defineKeyValueStore } from '../defineKeyValueStore';
import { getAllKeyValueStoreConfigs } from './getAllKeyValueStoreConfigs';
import { getKeyValueStoreByName } from './getKeyValueStoreByName';
import { getOwnedKeyValueStoreConfigs } from './getOwnedKeyValueStoreConfigs';
import { resolveKeyValueStoreOrThrow } from './resolveKeyValueStoreOrThrow';

const config = [
  defineApplication('app', 'root'),
  defineModule('svc'),
  defineKeyValueStore('mine', 'id'),
  defineKeyValueStore('theirs', 'id', [], { owner: { module: 'other' } }),
];

describe('key value store accessors', () => {
  it('lists every store, and only the owned ones', () => {
    expect(getAllKeyValueStoreConfigs(config).map((store) => store.keyValueStoreName)).toEqual(['mine', 'theirs']);
    expect(getOwnedKeyValueStoreConfigs(config).map((store) => store.keyValueStoreName)).toEqual(['mine']);
  });

  it('finds a store by name, null when unknown', () => {
    expect(getKeyValueStoreByName('mine', config)?.partitionKey).toEqual({ key: 'id', type: 'string' });
    expect(getKeyValueStoreByName('missing', config)).toBeNull();
  });

  it('resolves a store by name or throws naming it', () => {
    expect(resolveKeyValueStoreOrThrow('theirs', config).keyValueStoreName).toBe('theirs');
    expect(() => resolveKeyValueStoreOrThrow('missing', config)).toThrow('No key value store config setting found for [missing]');
  });
});
