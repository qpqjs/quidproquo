import { QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../../QPQConfig';

export interface AccountAuthFailureAlert {
  emails: string[];

  /** Failed Cognito sign-ins per 5 minutes before alerting. Defaults to 10. */
  thresholdPer5Minutes?: number;
}

export interface AccountSecurityServicesQPQConfigSetting extends QPQConfigSetting {
  /**
   * Creates a GuardDuty detector. Opt-in: detectors are one-per-account+region and are
   * often managed outside the stack (e.g. an AWS Organizations delegated admin
   * auto-enables them, and a CloudFormation create would collide with that detector).
   */
  enableGuardDuty?: boolean;

  /**
   * Creates a Security Hub hub. Opt-in: its compliance standards require AWS Config
   * recording, which bills per configuration item and often outweighs everything else.
   * Enable knowingly.
   */
  enableSecurityHub?: boolean;

  /**
   * Email an alert when Cognito sign-in failures spike (credential stuffing hitting
   * Cognito directly, bypassing the apis). Detected via a metric filter on the account
   * CloudTrail's CloudWatch log group - requires `defineAccountCloudTrail` with
   * `cloudWatchLogs` enabled.
   */
  cognitoAuthFailureAlert?: AccountAuthFailureAlert;
}

/**
 * Account-level AWS security services (GuardDuty threat detection, Security Hub),
 * declared in the account config and deployed by the account stack. Everything is
 * opt-in - creating account singletons should be a deliberate act. Both services are
 * one-per-account+region: if multiple environments share an AWS account, enable them
 * in only one environment's account config.
 */
export const defineAccountSecurityServices = (
  options?: Omit<AccountSecurityServicesQPQConfigSetting, 'configSettingType' | 'uniqueKey'>,
): AccountSecurityServicesQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.accountSecurityServices,
  uniqueKey: 'accountSecurityServices',

  enableGuardDuty: options?.enableGuardDuty,
  enableSecurityHub: options?.enableSecurityHub,
  cognitoAuthFailureAlert: options?.cognitoAuthFailureAlert,
});
