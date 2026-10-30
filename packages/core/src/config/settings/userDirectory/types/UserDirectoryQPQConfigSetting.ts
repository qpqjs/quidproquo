import { CrossModuleOwner } from '../../../../types';
import { QPQConfigSetting } from '../../../QPQConfig';
import { CustomAuthRuntime, EmailTemplates } from '../../emailTemplates';
import { AuthDirectoryDnsRecord } from './AuthDirectoryDnsRecord';
import { UserDirectoryMfaSettings } from './UserDirectoryMfaSettings';

export type UserDirectoryQPQConfigSetting = {
  name: string;

  phoneRequired: boolean;

  selfSignUpEnabled: boolean;

  emailTemplates: EmailTemplates;

  owner?: CrossModuleOwner;

  dnsRecord?: AuthDirectoryDnsRecord;

  customAuthRuntime?: CustomAuthRuntime;

  mfa: UserDirectoryMfaSettings;

  accessTokenValidityMinutes?: number;
} & QPQConfigSetting;
