import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineSecret } from './secret';

describe('defineSecret', () => {
  it('builds a Secret setting with the given key', () => {
    expect(defineSecret('apiKey')).toEqual({
      configSettingType: QPQCoreConfigSettingType.secret,
      uniqueKey: 'apiKey',
      key: 'apiKey',
      owner: undefined,
    });
  });

  it('converts the owner to a resourceNameOverride', () => {
    expect(defineSecret('apiKey', { owner: { module: 'other', secretName: 'apiKey' } }).owner).toEqual({
      module: 'other',
      secretName: 'apiKey',
      resourceNameOverride: 'apiKey',
    });
  });
});
