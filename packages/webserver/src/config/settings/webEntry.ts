import { QPQConfigAdvancedSettings, QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { ResponseSecurityHeaders } from '../types/ResponseSecurityHeaders';

export interface WebDomainOptions {
  subDomainName?: string;
  onRootDomain: boolean;
}

export interface StorageDriveOptions {
  sourceStorageDrive?: string;
  autoUpload: boolean;

  /**
   * Serve the owning service's built views bundle from this entry: `qpq go`
   * copies the service's views dist to the root of `sourceStorageDrive` (as
   * well as its usual prefix in the shared federated views bucket). Makes the
   * service a standalone host on its own domain, the way shell is the root site.
   */
  syncServiceViews?: boolean;
}

export interface QPQConfigAdvancedWebEntrySettings extends QPQConfigAdvancedSettings {
  buildPath?: string;

  storageDrive?: StorageDriveOptions;

  domain: WebDomainOptions;

  cacheSettingsName?: string;
  indexRoot?: string;
  ignoreCache?: string[];

  compressFiles?: boolean;

  cloudflareApiKeySecretName?: string;

  securityHeaders?: ResponseSecurityHeaders;

  /**
   * Browser origins allowed to cross-origin `fetch` this web entry's (public,
   * static) assets. Leave undefined to scope to this service's own domain
   * (`https://<domain>` + `https://*.<domain>`); pass `['*']` to allow any
   * origin (e.g. serving assets as a public CDN / cross-origin fonts).
   */
  corsAllowedOrigins?: string[];
}

export interface WebEntryQPQWebServerConfigSetting extends QPQConfigSetting {
  name: string;
  indexRoot: string;

  storageDrive: StorageDriveOptions;
  domain: WebDomainOptions;

  buildPath?: string;
  cacheSettingsName?: string;
  ignoreCache: string[];

  compressFiles: boolean;

  cloudflareApiKeySecretName?: string;

  securityHeaders?: ResponseSecurityHeaders;

  corsAllowedOrigins?: string[];
}

export const defineWebEntry = (name: string, options: QPQConfigAdvancedWebEntrySettings): WebEntryQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.WebEntry,
  uniqueKey: name,

  name,
  indexRoot: options?.indexRoot || 'index.html',

  storageDrive: options?.storageDrive || {
    autoUpload: true,
  },

  domain: options.domain,

  buildPath: options?.buildPath,

  ignoreCache: options?.ignoreCache || [],

  compressFiles: options?.compressFiles ?? true,

  securityHeaders: options?.securityHeaders,

  cloudflareApiKeySecretName: options?.cloudflareApiKeySecretName,

  cacheSettingsName: options?.cacheSettingsName,

  corsAllowedOrigins: options?.corsAllowedOrigins,
});
