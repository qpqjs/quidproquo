import { QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../../QPQConfig';

export interface WafProtectionQPQConfigSetting extends QPQConfigSetting {}

/**
 * Opt this service's api gateway stage and cloudfront distributions into the web acls
 * created by `defineBootstrapWaf`. A separate setting because service configs and the
 * bootstrap config are separate arrays - the acl arns are resolved by convention from
 * SSM at deploy time (bootstrap must be deployed first, as always).
 */
export const defineWafProtection = (): WafProtectionQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.wafProtection,
  uniqueKey: 'wafProtection',
});
