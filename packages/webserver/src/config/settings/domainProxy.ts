import { QPQConfigAdvancedSettings, QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export enum DomainProxyViewerProtocolPolicy {
  /** HTTPS only */
  HTTPS_ONLY = 'https-only',
  /** Will redirect HTTP requests to HTTPS */
  REDIRECT_TO_HTTPS = 'redirect-to-https',
  /** Both HTTP and HTTPS supported */
  ALLOW_ALL = 'allow-all',
}

export interface DomainProxyDomainOptions {
  subDomainNames?: string[];
  onRootDomain: boolean;
}

export interface QPQConfigAdvancedDomainProxySettings extends QPQConfigAdvancedSettings {
  httpProxyDomain: string;

  domain: DomainProxyDomainOptions;

  cacheSettingsName?: string;

  ignoreCache?: string[];

  domainProxyViewerProtocolPolicy: DomainProxyViewerProtocolPolicy;
}

export interface DomainProxyQPQWebServerConfigSetting extends QPQConfigSetting {
  name: string;

  domainProxyViewerProtocolPolicy: DomainProxyViewerProtocolPolicy;

  domain: DomainProxyDomainOptions;
  httpProxyDomain: string;

  cacheSettingsName?: string;
  ignoreCache: string[];
}

export const defineDomainProxy = (name: string, options: QPQConfigAdvancedDomainProxySettings): DomainProxyQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.DomainProxy,
  uniqueKey: name,

  name,

  httpProxyDomain: options.httpProxyDomain,

  domain: options.domain,

  ignoreCache: options.ignoreCache || [],

  cacheSettingsName: options.cacheSettingsName,

  domainProxyViewerProtocolPolicy: options.domainProxyViewerProtocolPolicy,
});
