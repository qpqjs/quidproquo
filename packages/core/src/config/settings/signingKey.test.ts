import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineSigningKey } from './signingKey';

describe('defineSigningKey', () => {
  it('builds a SigningKey setting with the given key name', () => {
    expect(defineSigningKey('access-token-key')).toEqual({
      configSettingType: QPQCoreConfigSettingType.signingKey,
      uniqueKey: 'access-token-key',
      keyName: 'access-token-key',
      owner: undefined,
    });
  });

  it('converts the owner to a resourceNameOverride', () => {
    expect(defineSigningKey('access-token-key', { owner: { module: 'other', signingKeyName: 'access-token-key' } }).owner).toEqual({
      module: 'other',
      signingKeyName: 'access-token-key',
      resourceNameOverride: 'access-token-key',
    });
  });
});
