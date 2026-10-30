import { describe, expect, it } from 'vitest';

import { defineApplication } from '../../applicationName';
import { defineModule } from '../../moduleName';
import { defineCryptoKey } from '../defineCryptoKey';
import { getAllCryptoKeyConfigs } from './getAllCryptoKeyConfigs';
import { getCryptoKeyByName } from './getCryptoKeyByName';
import { getOwnedCryptoKeyConfigs } from './getOwnedCryptoKeyConfigs';
import { resolveCryptoKeyOrThrow } from './resolveCryptoKeyOrThrow';

const config = [
  defineApplication('app', 'production', 'root'),
  defineModule('svc'),
  defineCryptoKey('mine'),
  defineCryptoKey('theirs', { owner: { module: 'other', cryptoKeyName: 'theirs' } }),
];

describe('cryptoKey accessors', () => {
  it('lists every key, and only the owned ones', () => {
    expect(getAllCryptoKeyConfigs(config).map((key) => key.keyName)).toEqual(['mine', 'theirs']);
    expect(getOwnedCryptoKeyConfigs(config).map((key) => key.keyName)).toEqual(['mine']);
  });

  it('finds a key by name, null when unknown', () => {
    expect(getCryptoKeyByName('mine', config)?.keyName).toBe('mine');
    expect(getCryptoKeyByName('missing', config)).toBeNull();
  });

  it('resolves a key by name or throws naming it', () => {
    expect(resolveCryptoKeyOrThrow('theirs', config).keyName).toBe('theirs');
    expect(() => resolveCryptoKeyOrThrow('missing', config)).toThrow('Can not find crypto key [missing]');
  });
});
