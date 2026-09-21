import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineEmailReceivingDomain } from './emailReceivingDomain';

describe('defineEmailReceivingDomain', () => {
  it('defaults the subdomain to inbox', () => {
    expect(defineEmailReceivingDomain()).toEqual({
      configSettingType: QPQWebServerConfigSettingType.EmailReceivingDomain,
      uniqueKey: 'emailReceivingDomain',
      subdomain: 'inbox',
    });
  });

  it('carries a custom subdomain', () => {
    expect(defineEmailReceivingDomain('mail').subdomain).toBe('mail');
  });
});
