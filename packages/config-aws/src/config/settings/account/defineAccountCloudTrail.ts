import { QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../../QPQConfig';

export interface AccountCloudTrailQPQConfigSetting extends QPQConfigSetting {
  name: string;
  retentionDays?: number;
  enableLogFileValidation?: boolean;
  multiRegion?: boolean;
  includeGlobalServiceEvents?: boolean;
  cloudWatchLogs?: { retentionDays?: number };
}

/**
 * Account-level CloudTrail audit trail, declared in the account config and deployed by
 * the account stack. One per account is the expected usage - additional trails bill a
 * second copy of every management event.
 */
export const defineAccountCloudTrail = (
  name: AccountCloudTrailQPQConfigSetting['name'],
  options?: Omit<AccountCloudTrailQPQConfigSetting, 'configSettingType' | 'uniqueKey' | 'name'>,
): AccountCloudTrailQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.accountCloudTrail,
  uniqueKey: name,

  name,
  retentionDays: options?.retentionDays,
  enableLogFileValidation: options?.enableLogFileValidation,
  multiRegion: options?.multiRegion,
  includeGlobalServiceEvents: options?.includeGlobalServiceEvents,
  cloudWatchLogs: options?.cloudWatchLogs,
});
