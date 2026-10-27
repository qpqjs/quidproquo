import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../QPQConfig';
import { AwsAlarmLambdaMetricName, AwsAlarmNamespace, AwsAlarmOperator, AwsAlarmPeriod, AwsAlarmStatistic, defineAwsAlarm } from './awsAlarm';

describe('defineAwsAlarm', () => {
  const alarmSettings = {
    namespace: AwsAlarmNamespace.Lambda,
    metricName: AwsAlarmLambdaMetricName.Errors,
    statistic: AwsAlarmStatistic.Sum,
    period: AwsAlarmPeriod.FiveMinutes,
    operator: AwsAlarmOperator.GreaterThanThreshold,
    threshold: 1,
    datapointsToAlarm: 1,
    evaluationPeriodsToAlarm: 1,
    onAlarm: {},
  } as const;

  it('builds an alarm setting keyed by name', () => {
    expect(defineAwsAlarm('errors', alarmSettings)).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsServiceAlarm,
      uniqueKey: 'errors',
      name: 'errors',
      alarmSettings,
    });
  });
});
