import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../QPQConfig';
import { defineEmailSenderAllowList } from './emailSenderAllowList';

describe('defineEmailSenderAllowList', () => {
  it('builds an allow-list setting keyed by its addresses', () => {
    expect(defineEmailSenderAllowList(['joe@external.com', 'test@external.com'])).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsEmailSenderAllowList,
      uniqueKey: 'joe@external.com|test@external.com',
      allowedEmailAddresses: ['joe@external.com', 'test@external.com'],
    });
  });
});
