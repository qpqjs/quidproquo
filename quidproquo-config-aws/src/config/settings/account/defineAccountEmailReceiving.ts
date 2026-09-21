import { QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../../QPQConfig';

export type AccountEmailReceivingQPQConfigSetting = QPQConfigSetting;

/**
 * The account's SES receipt rule set, created and made active by the account stack. SES allows one
 * active set per account and region, so it is an account singleton; every app's inf stack adds its
 * own rules to it (see defineEmailReceiver). Nothing receives until this is deployed.
 */
export const defineAccountEmailReceiving = (): AccountEmailReceivingQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.accountEmailReceiving,
  uniqueKey: 'accountEmailReceiving',
});
