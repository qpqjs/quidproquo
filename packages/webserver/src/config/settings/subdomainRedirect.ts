import { QPQConfigAdvancedSettings, QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export interface QPQConfigAdvancedSubdomainRedirectSettings extends QPQConfigAdvancedSettings {
  cloudflareApiKeySecretName?: string;
}

export interface SubdomainRedirectQPQWebServerConfigSetting extends QPQConfigSetting {
  subdomain: string;
  redirectUrl: string;
  apiBuildPath: string;
  onRootDomain: boolean;
  addEnvironment: boolean;
  addFeatureEnvironment: boolean;

  cloudflareApiKeySecretName?: string;
}

export const defineSubdomainRedirect = (
  subdomain: string,
  apiBuildPath: string,
  redirectUrl: string,
  addEnvironment: boolean = true,
  addFeatureEnvironment: boolean = true,
  onRootDomain: boolean = true,
  options: QPQConfigAdvancedSubdomainRedirectSettings = {},
): SubdomainRedirectQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.SubdomainRedirect,
  uniqueKey: subdomain,

  subdomain,
  redirectUrl,

  apiBuildPath,

  addEnvironment,
  addFeatureEnvironment,
  onRootDomain,

  cloudflareApiKeySecretName: options.cloudflareApiKeySecretName,
});
