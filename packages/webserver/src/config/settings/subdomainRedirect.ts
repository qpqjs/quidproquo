import { QPQConfigAdvancedSettings, QPQConfigSetting } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export type QPQConfigAdvancedSubdomainRedirectSettings = {
  cloudflareApiKeySecretName?: string;
} & QPQConfigAdvancedSettings;

export type SubdomainRedirectQPQWebServerConfigSetting = {
  subdomain: string;
  redirectUrl: string;
  apiBuildPath: string;
  onRootDomain: boolean;
  addEnvironment: boolean;
  addFeatureEnvironment: boolean;

  cloudflareApiKeySecretName?: string;
} & QPQConfigSetting;

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
