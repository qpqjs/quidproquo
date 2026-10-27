import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineApiKey } from './apiKey';

describe('defineApiKey', () => {
  it('builds an ApiKey setting with the name and undefined value/description by default', () => {
    expect(defineApiKey('primary')).toEqual({
      configSettingType: QPQWebServerConfigSettingType.ApiKey,
      uniqueKey: 'primary',
      apiKey: { name: 'primary', value: undefined, description: undefined },
    });
  });

  it('carries the supplied value and description', () => {
    const setting = defineApiKey('primary', { value: 'secret', description: 'main key' });

    expect(setting.apiKey).toEqual({ name: 'primary', value: 'secret', description: 'main key' });
  });
});
