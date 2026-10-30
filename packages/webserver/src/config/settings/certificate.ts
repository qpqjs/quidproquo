import { QPQConfigAdvancedSettings, QPQConfigSetting } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export type QPQConfigAdvancedCertificateSettings = {} & QPQConfigAdvancedSettings;

export type CertificateQPQWebServerConfigSetting = {
  onRootDomain: boolean;
  subdomain?: string;
  rootDomain: string;
  deprecated: boolean;
} & QPQConfigSetting;

export const defineCertificate = (
  onRootDomain: boolean,
  rootDomain: string,
  subdomain?: string,
  options?: QPQConfigAdvancedCertificateSettings,
): CertificateQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.Certificate,
  uniqueKey: `${onRootDomain}:${subdomain ?? ''}`,

  onRootDomain,
  subdomain,
  rootDomain,
  deprecated: options?.deprecated ?? false,
});
