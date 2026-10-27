import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineFileUploadSettings } from './fileUploadSettings';

describe('defineFileUploadSettings', () => {
  it('builds a FileUploadSettings setting holding the partial overrides', () => {
    const fileUploadSettings = { maxFileSizeBytes: 1024, allowedMimeTypes: ['image/*'] };

    expect(defineFileUploadSettings(fileUploadSettings)).toEqual({
      configSettingType: QPQWebServerConfigSettingType.FileUploadSettings,
      uniqueKey: 'fileUploadSettings',
      fileUploadSettings,
    });
  });
});
