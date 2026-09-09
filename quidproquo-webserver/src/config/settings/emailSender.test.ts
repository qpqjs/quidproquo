import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineEmailSender } from './emailSender';

describe('defineEmailSender', () => {
  it('builds the single EmailSender setting', () => {
    expect(defineEmailSender()).toEqual({
      configSettingType: QPQWebServerConfigSettingType.EmailSender,
      uniqueKey: 'emailSender',
    });
  });
});
