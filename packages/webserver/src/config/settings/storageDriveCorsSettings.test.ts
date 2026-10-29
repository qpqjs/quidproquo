import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineStorageDriveCorsSettings } from './storageDriveCorsSettings';

describe('defineStorageDriveCorsSettings', () => {
  it('builds a StorageDriveCorsSettings setting keyed by the drive, not deprecated by default', () => {
    expect(defineStorageDriveCorsSettings('uploads', ['https://app.example'])).toEqual({
      configSettingType: QPQWebServerConfigSettingType.StorageDriveCorsSettings,
      uniqueKey: 'uploads',
      storageDriveName: 'uploads',
      allowedOrigins: ['https://app.example'],
      deprecated: false,
    });
  });

  it('honours the deprecated flag', () => {
    expect(defineStorageDriveCorsSettings('uploads', ['*'], { deprecated: true }).deprecated).toBe(true);
  });
});
