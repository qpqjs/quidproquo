import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../../QPQConfig';
import { defineAccountSecurityServices } from './defineAccountSecurityServices';

describe('defineAccountSecurityServices', () => {
  it('builds a security services setting with undefined options when omitted', () => {
    expect(defineAccountSecurityServices()).toEqual({
      configSettingType: QPQAwsConfigSettingType.accountSecurityServices,
      uniqueKey: 'accountSecurityServices',
      enableGuardDuty: undefined,
      enableSecurityHub: undefined,
      cognitoAuthFailureAlert: undefined,
    });
  });

  it('carries through the supplied options', () => {
    const cognitoAuthFailureAlert = { emails: ['ops@example.com'], thresholdPer5Minutes: 25 };

    expect(defineAccountSecurityServices({ enableGuardDuty: true, enableSecurityHub: true, cognitoAuthFailureAlert })).toEqual({
      configSettingType: QPQAwsConfigSettingType.accountSecurityServices,
      uniqueKey: 'accountSecurityServices',
      enableGuardDuty: true,
      enableSecurityHub: true,
      cognitoAuthFailureAlert,
    });
  });
});
