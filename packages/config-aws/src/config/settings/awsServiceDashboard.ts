import { QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../QPQConfig';

export interface AwsServiceDashboardQPQConfigSetting extends QPQConfigSetting {
  /** Skip the anomaly detector models, anomaly band widgets and api latency anomaly alarms. */
  disableAnomalyDetection?: boolean;
}

/**
 * A default operational CloudWatch dashboard for this service (api traffic/errors/latency,
 * lambda invocations/errors/duration/concurrency, dynamo throttles/capacity, queue depth,
 * waf allowed/blocked), plus anomaly detection on api latency and lambda duration with
 * latency anomaly alarms routed like the default resource alarms (via defineNotifyError).
 * Cost note: dashboards are ~$3/month each beyond the first 3 free per account, so a
 * dashboard per service adds up - declare this only on services worth watching.
 */
export const defineAwsServiceDashboard = (
  options?: Omit<AwsServiceDashboardQPQConfigSetting, 'configSettingType' | 'uniqueKey'>,
): AwsServiceDashboardQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.awsServiceDashboard,
  uniqueKey: 'awsServiceDashboard',

  disableAnomalyDetection: options?.disableAnomalyDetection,
});
