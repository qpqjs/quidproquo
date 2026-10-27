import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineUserDirectory, UserDirectoryMfaMode, UserDirectoryMfaSecondFactor } from './userDirectory';

describe('defineUserDirectory', () => {
  it('builds a UserDirectory setting with the given name and defaults', () => {
    expect(defineUserDirectory('Members')).toEqual({
      configSettingType: QPQCoreConfigSettingType.userDirectory,
      uniqueKey: 'Members',
      name: 'Members',
      phoneRequired: false,
      selfSignUpEnabled: false,
      emailTemplates: {
        verifyEmail: undefined,
        resetPassword: undefined,
        resetPasswordAdmin: undefined,
      },
      dnsRecord: undefined,
      customAuthRuntime: undefined,
      mfa: {
        mode: UserDirectoryMfaMode.off,
        secondFactors: [UserDirectoryMfaSecondFactor.totp],
      },
      owner: undefined,
    });
  });

  it('defaults mfa to off with totp as the only second factor', () => {
    expect(defineUserDirectory('Members').mfa).toEqual({
      mode: UserDirectoryMfaMode.off,
      secondFactors: [UserDirectoryMfaSecondFactor.totp],
    });
  });

  it('keeps the supplied mfa mode and falls back to totp when no second factors are given', () => {
    expect(defineUserDirectory('Members', { mfa: { mode: UserDirectoryMfaMode.required } }).mfa).toEqual({
      mode: UserDirectoryMfaMode.required,
      secondFactors: [UserDirectoryMfaSecondFactor.totp],
    });
  });

  it('falls back to totp when an empty secondFactors list is given', () => {
    expect(defineUserDirectory('Members', { mfa: { mode: UserDirectoryMfaMode.optional, secondFactors: [] } }).mfa.secondFactors).toEqual([
      UserDirectoryMfaSecondFactor.totp,
    ]);
  });

  it('applies supplied account options', () => {
    const setting = defineUserDirectory('Members', { phoneRequired: true, selfSignUpEnabled: true });

    expect(setting.phoneRequired).toBe(true);
    expect(setting.selfSignUpEnabled).toBe(true);
  });
});
