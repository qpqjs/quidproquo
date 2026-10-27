import { QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export interface FileUploadSettings {
  /** Maximum size of any single uploaded file. Uploads with a larger file are rejected with a 413. */
  maxFileSizeBytes: number;

  /** Maximum number of files in a single multipart request. */
  maxFileCount: number;

  /** Maximum number of non-file fields in a single multipart request. */
  maxFieldCount: number;

  /** Maximum size of any single non-file field value. Larger values are truncated by the parser. */
  maxFieldSizeBytes: number;

  /**
   * Content types accepted for uploaded files, e.g. `['image/*', 'application/pdf']`
   * (`type/*` wildcards supported). Omit to accept any content type.
   */
  allowedMimeTypes?: string[];
}

export interface FileUploadSettingsQPQWebServerConfigSetting extends QPQConfigSetting {
  fileUploadSettings: Partial<FileUploadSettings>;
}

/**
 * Service-wide limits for multipart/form-data file uploads. Sensible defaults
 * apply even when this setting is not declared — declare it only to override them.
 */
export const defineFileUploadSettings = (fileUploadSettings: Partial<FileUploadSettings>): FileUploadSettingsQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.FileUploadSettings,
  uniqueKey: 'fileUploadSettings',

  fileUploadSettings,
});
