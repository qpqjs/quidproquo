import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineCryptoKey } from './cryptoKey';

describe('defineCryptoKey', () => {
  it('builds a CryptoKey setting with the given key name', () => {
    expect(defineCryptoKey('docgen-crypto-key')).toEqual({
      configSettingType: QPQCoreConfigSettingType.cryptoKey,
      uniqueKey: 'docgen-crypto-key',
      keyName: 'docgen-crypto-key',
      owner: undefined,
    });
  });

  it('converts the owner to a resourceNameOverride', () => {
    expect(defineCryptoKey('docgen-crypto-key', { owner: { module: 'other', cryptoKeyName: 'docgen-crypto-key' } }).owner).toEqual({
      module: 'other',
      cryptoKeyName: 'docgen-crypto-key',
      resourceNameOverride: 'docgen-crypto-key',
    });
  });
});
