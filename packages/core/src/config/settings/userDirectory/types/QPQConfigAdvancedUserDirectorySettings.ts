import { CrossModuleOwner } from '../../../../types';
import { QPQConfigAdvancedSettings } from '../../../QPQConfig';
import { CustomAuthRuntime, EmailTemplates } from '../../emailTemplates';
import { AuthDirectoryDnsRecord } from './AuthDirectoryDnsRecord';
import { UserDirectoryMfaSettings } from './UserDirectoryMfaSettings';

export type QPQConfigAdvancedUserDirectorySettings = {
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
} & QPQConfigAdvancedSettings;
