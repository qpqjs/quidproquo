import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../QPQConfig';
import { defineAwsServiceAccountInfo } from './serviceAccountInfo';

describe('defineAwsServiceAccountInfo', () => {
  it('applies defaults when only the account and region are given', () => {
    expect(defineAwsServiceAccountInfo('123456789012', 'us-east-1')).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsServiceAccountInfo,
      uniqueKey: 'AwsServiceAccountInfo',
      deployAccountId: '123456789012',
      deployRegion: 'us-east-1',
      serviceInfoMap: [],
      apiLayers: [],
      lambdaMaxMemoryInMiB: 1024,
      cloudWatchLogRetentionDays: 7,
      logServiceName: undefined,
      disableLogs: false,
      disableLambdaWarming: false,
      disableReservedConcurrency: false,
      disableTracing: false,
      instantLogs: false,
    });
  });

  it('carries through service info, layers and option flags', () => {
    const serviceInfoMap = [{ moduleName: 'auth', awsAccountId: '999', awsRegion: 'us-west-2' }];
    const apiLayers = [{ name: 'shared' }];

    const setting = defineAwsServiceAccountInfo('111', 'eu-west-1', serviceInfoMap, {
      apiLayers,
      lambdaMaxMemoryInMiB: 2048,
      cloudWatchLogRetentionDays: 30,
      logServiceName: 'logs',
      disableLogs: true,
      disableLambdaWarming: true,
      disableReservedConcurrency: true,
      disableTracing: true,
      instantLogs: true,
    });

    expect(setting).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsServiceAccountInfo,
      uniqueKey: 'AwsServiceAccountInfo',
      deployAccountId: '111',
      deployRegion: 'eu-west-1',
      serviceInfoMap,
      apiLayers,
      lambdaMaxMemoryInMiB: 2048,
      cloudWatchLogRetentionDays: 30,
      logServiceName: 'logs',
      disableLogs: true,
      disableLambdaWarming: true,
      disableReservedConcurrency: true,
      disableTracing: true,
      instantLogs: true,
    });
  });

  it('falls back to the default memory when lambdaMaxMemoryInMiB is zero', () => {
    expect(defineAwsServiceAccountInfo('111', 'eu-west-1', [], { lambdaMaxMemoryInMiB: 0 }).lambdaMaxMemoryInMiB).toBe(1024);
  });

  it('falls back to a week of CloudWatch retention when cloudWatchLogRetentionDays is zero', () => {
    expect(defineAwsServiceAccountInfo('111', 'eu-west-1', [], { cloudWatchLogRetentionDays: 0 }).cloudWatchLogRetentionDays).toBe(7);
  });
});
