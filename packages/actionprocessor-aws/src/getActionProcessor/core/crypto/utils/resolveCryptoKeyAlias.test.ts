import { buildTestQpqConfig, defineCryptoKey } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { resolveCryptoKeyAlias } from './resolveCryptoKeyAlias';

describe('resolveCryptoKeyAlias', () => {
  it('derives the runtime alias from the config', () => {
    const qpqConfig = buildTestQpqConfig([defineCryptoKey('my-key')]);

    expect(resolveCryptoKeyAlias('my-key', qpqConfig)).toBe('alias/my-key-test-app-test-module-development');
  });

  it('returns null when the key is not configured', () => {
    const qpqConfig = buildTestQpqConfig([defineCryptoKey('my-key')]);

    expect(resolveCryptoKeyAlias('other-key', qpqConfig)).toBeNull();
  });

  it('resolves cross-module owned keys against the owning module', () => {
    const qpqConfig = buildTestQpqConfig([defineCryptoKey('my-key', { owner: { module: 'other-module', cryptoKeyName: 'my-key' } })]);

    expect(resolveCryptoKeyAlias('my-key', qpqConfig)).toBe('alias/my-key-test-app-other-module-development');
  });
});
