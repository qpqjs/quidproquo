import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../../QPQConfig';
import { defineAccountCloudTrail } from './defineAccountCloudTrail';

describe('defineAccountCloudTrail', () => {
  it('builds a cloud trail setting keyed by name with undefined options when omitted', () => {
    expect(defineAccountCloudTrail('trail')).toEqual({
      configSettingType: QPQAwsConfigSettingType.accountCloudTrail,
      uniqueKey: 'trail',
      name: 'trail',
      retentionDays: undefined,
      enableLogFileValidation: undefined,
      multiRegion: undefined,
      includeGlobalServiceEvents: undefined,
      cloudWatchLogs: undefined,
    });
  });

  it('carries through the supplied options', () => {
    expect(
      defineAccountCloudTrail('trail', {
        retentionDays: 30,
        enableLogFileValidation: true,
        multiRegion: true,
        includeGlobalServiceEvents: false,
        cloudWatchLogs: { retentionDays: 7 },
      }),
    ).toEqual({
      configSettingType: QPQAwsConfigSettingType.accountCloudTrail,
      uniqueKey: 'trail',
      name: 'trail',
      retentionDays: 30,
      enableLogFileValidation: true,
      multiRegion: true,
      includeGlobalServiceEvents: false,
      cloudWatchLogs: { retentionDays: 7 },
    });
  });
});
