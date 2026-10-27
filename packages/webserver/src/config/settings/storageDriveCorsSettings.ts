import { QPQConfigAdvancedSettings, QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export interface QPQConfigAdvancedStorageDriveCorsSettings extends QPQConfigAdvancedSettings {}

export interface StorageDriveCorsSettingsQPQWebServerConfigSetting extends QPQConfigSetting {
  storageDriveName: string;

  /**
   * Browser origins allowed to read/write this drive's objects via cross-origin
   * `fetch`/`XHR` (e.g. presigned uploads/downloads). Pass `['*']` to allow any
   * origin, or an explicit list for cross-domain frontends. When no CORS setting
   * is declared for a drive, its CORS defaults to this service's own domain.
   */
  allowedOrigins: string[];
}

/**
 * Web-layer CORS policy for a (core) storage drive, keyed by the drive's name.
 * CORS only matters when a browser talks to the bucket, so it lives here in the
 * webserver config rather than on the core `defineStorageDrive`.
 */
export const defineStorageDriveCorsSettings = (
  storageDriveName: string,
  allowedOrigins: string[],
  options?: QPQConfigAdvancedStorageDriveCorsSettings,
): StorageDriveCorsSettingsQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.StorageDriveCorsSettings,
  uniqueKey: storageDriveName,

  storageDriveName,

  allowedOrigins,
});
