import { QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../QPQConfig';

export interface EmailSenderAllowListQPQConfigSetting extends QPQConfigSetting {
  allowedEmailAddresses: string[];
}

/**
 * Recipient addresses this service is allowed to email while the SES account is
 * in sandbox mode. In sandbox, SES authorizes a send against the recipient's
 * identity as well as the sender's, so the exact-ARN send grant needs each
 * recipient identity listed too. The addresses must also be verified identities
 * in the SES console (sandbox requires that anyway).
 *
 * This is an AWS-specific concession, not a portable email concept, hence it
 * lives in config-aws beside `defineEmailSender` rather than on the webserver
 * setting. Multiple calls are additive. Once the account has SES production
 * access this setting does nothing useful and can be deleted.
 */
export const defineEmailSenderAllowList = (allowedEmailAddresses: string[]): EmailSenderAllowListQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.awsEmailSenderAllowList,
  uniqueKey: allowedEmailAddresses.join('|'),

  allowedEmailAddresses,
});
