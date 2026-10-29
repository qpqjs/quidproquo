import { QPQConfigAdvancedSettings, QPQConfigSetting } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export type DomainProxyDomainOptions = {
  subDomainNames?: string[];
  onRootDomain: boolean;
};

export type QPQConfigAdvancedDomainProxySettings = {
  httpProxyDomain: string;

  domain: DomainProxyDomainOptions;

  cacheSettingsName?: string;

  ignoreCache?: string[];
} & QPQConfigAdvancedSettings;

export type DomainProxyQPQWebServerConfigSetting = {
  name: string;

  domain: DomainProxyDomainOptions;
  httpProxyDomain: string;

  cacheSettingsName?: string;
  ignoreCache: string[];
} & QPQConfigSetting;

export const defineDomainProxy = (name: string, options: QPQConfigAdvancedDomainProxySettings): DomainProxyQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.DomainProxy,
  uniqueKey: name,

  name,

  httpProxyDomain: options.httpProxyDomain,

  domain: options.domain,

  ignoreCache: options.ignoreCache ?? [],

  cacheSettingsName: options.cacheSettingsName,
});
