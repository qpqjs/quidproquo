import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../QPQConfig';
import { defineAwsServiceDashboard } from './awsServiceDashboard';

describe('defineAwsServiceDashboard', () => {
  it('builds a dashboard setting with undefined options when omitted', () => {
    expect(defineAwsServiceDashboard()).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsServiceDashboard,
      uniqueKey: 'awsServiceDashboard',
      disableAnomalyDetection: undefined,
    });
  });

  it('carries through the supplied options', () => {
    expect(defineAwsServiceDashboard({ disableAnomalyDetection: true })).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsServiceDashboard,
      uniqueKey: 'awsServiceDashboard',
      disableAnomalyDetection: true,
    });
  });
});
