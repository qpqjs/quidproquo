import { QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../../QPQConfig';

export enum BudgetThresholdType {
  actual = 'actual',
  forecasted = 'forecasted',
}

export interface BudgetThreshold {
  thresholdPercent: number;
  type: BudgetThresholdType;
}

export interface AccountBudgetAnomalyDetection {
  /** Anomaly detection is created alongside the budget by default; set to opt out. */
  disabled?: boolean;

  /** Minimum total cost impact (USD) before an anomaly alert is sent. Defaults to 10. */
  minimumImpactUsd?: number;
}

export interface AccountBudgetQPQConfigSetting extends QPQConfigSetting {
  name: string;

  /** Monthly account cost budget in USD that the threshold alerts are relative to. */
  monthlyLimitUsd: number;

  /** Email addresses that receive budget threshold and cost anomaly alerts. */
  subscriberEmails: string[];

  /** Alert thresholds. Defaults to 80% actual, 100% forecasted, 100% actual, 150% actual. */
  thresholds?: BudgetThreshold[];

  anomalyDetection?: AccountBudgetAnomalyDetection;
}

/**
 * Account-level monthly cost budget with email threshold alerts, plus Cost Anomaly
 * Detection for spend that deviates from baseline (slow creep fixed thresholds miss).
 * Declared in the account config and deployed by the account stack. AWS allows only
 * one service-dimension anomaly monitor per account, so if multiple environments share
 * an account, enable anomaly detection in only one of them.
 */
export const defineAccountBudget = (
  name: AccountBudgetQPQConfigSetting['name'],
  monthlyLimitUsd: AccountBudgetQPQConfigSetting['monthlyLimitUsd'],
  subscriberEmails: AccountBudgetQPQConfigSetting['subscriberEmails'],
  options?: Omit<AccountBudgetQPQConfigSetting, 'configSettingType' | 'uniqueKey' | 'name' | 'monthlyLimitUsd' | 'subscriberEmails'>,
): AccountBudgetQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.accountBudget,
  uniqueKey: name,

  name,
  monthlyLimitUsd,
  subscriberEmails,
  thresholds: options?.thresholds,
  anomalyDetection: options?.anomalyDetection,
});
