import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineEmailReceiver } from './emailReceiver';

describe('defineEmailReceiver', () => {
  it('declares the receiver against the given drive with a derived prefix', () => {
    expect(defineEmailReceiver('support', { storageDriveName: 'mail' })).toEqual({
      configSettingType: QPQWebServerConfigSettingType.EmailReceiver,
      uniqueKey: 'emailReceiver-support',
      name: 'support',
      storageDriveName: 'mail',
      keyPrefix: 'email/support/',
    });
  });

  it('carries a custom prefix', () => {
    expect(defineEmailReceiver('support', { storageDriveName: 'mail', keyPrefix: 'in/' }).keyPrefix).toBe('in/');
  });
});
