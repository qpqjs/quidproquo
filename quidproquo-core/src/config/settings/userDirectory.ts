import { CrossModuleOwner } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';
import { CustomAuthRuntime, EmailTemplates } from './emailTemplates';

export type AuthDirectoryDnsRecord = {
  subdomain: string;
};

export enum UserDirectoryMfaMode {
  off = 'off',
  optional = 'optional',
  required = 'required',
}

export enum UserDirectoryMfaSecondFactor {
  totp = 'totp',
  // sms = 'sms', // future — additionally needs phone + SNS role infra.
}

export interface UserDirectoryMfaSettings {
  mode: UserDirectoryMfaMode;

  // Enabled second factors. Defaults to [totp] when omitted.
  secondFactors?: UserDirectoryMfaSecondFactor[];
}

export interface QPQConfigAdvancedUserDirectorySettings extends QPQConfigAdvancedSettings {
  phoneRequired?: boolean;

  selfSignUpEnabled?: boolean;

  emailTemplates?: EmailTemplates;

  owner?: CrossModuleOwner<'userDirectoryName'>;

  dnsRecord?: AuthDirectoryDnsRecord;

  customAuthRuntime?: CustomAuthRuntime;

  mfa?: UserDirectoryMfaSettings;

  // Access/ID token (JWT) lifetime in minutes. Shorter = a smaller window in which a
  // revoked session's still-valid access token keeps working (access tokens are stateless
  // and can't be revoked before expiry). Cognito allows 5–1440; omitted → Cognito default
  // (60).
  //
  // Generally web apps should refresh in the few mins so this should be > 5.
  accessTokenValidityMinutes?: number;
}

export interface UserDirectoryQPQConfigSetting extends QPQConfigSetting {
  name: string;

  phoneRequired: boolean;

  selfSignUpEnabled: boolean;

  emailTemplates: EmailTemplates;

  owner?: CrossModuleOwner;

  dnsRecord?: AuthDirectoryDnsRecord;

  customAuthRuntime?: CustomAuthRuntime;

  mfa: UserDirectoryMfaSettings;

  accessTokenValidityMinutes?: number;
}

export const defineUserDirectory = (name: string, options?: QPQConfigAdvancedUserDirectorySettings): UserDirectoryQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.userDirectory,
  uniqueKey: name,

  name,

  phoneRequired: options?.phoneRequired || false,

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
