import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../../utils/crossModuleUtils';
import { QPQConfigAdvancedUserDirectorySettings, UserDirectoryMfaMode, UserDirectoryMfaSecondFactor, UserDirectoryQPQConfigSetting } from './types';

export const defineUserDirectory = (name: string, options?: QPQConfigAdvancedUserDirectorySettings): UserDirectoryQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.userDirectory,
  uniqueKey: name,

  name,

  phoneRequired: options?.phoneRequired ?? false,

  selfSignUpEnabled: options?.selfSignUpEnabled ?? false,

  emailTemplates: {
    verifyEmail: options?.emailTemplates?.verifyEmail,
    resetPassword: options?.emailTemplates?.resetPassword,
    resetPasswordAdmin: options?.emailTemplates?.resetPasswordAdmin,
  },

  dnsRecord: options?.dnsRecord,
  customAuthRuntime: options?.customAuthRuntime,

  accessTokenValidityMinutes: options?.accessTokenValidityMinutes,

  mfa: {
    mode: options?.mfa?.mode ?? UserDirectoryMfaMode.off,
    secondFactors: options?.mfa?.secondFactors?.length ? options.mfa.secondFactors : [UserDirectoryMfaSecondFactor.totp],
  },

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
