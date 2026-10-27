import { QPQConfigAdvancedSettings, QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export interface QPQConfigAdvancedCertificateSettings extends QPQConfigAdvancedSettings {}

export interface CertificateQPQWebServerConfigSetting extends QPQConfigSetting {
  onRootDomain: boolean;
  subdomain?: string;
  rootDomain: string;
}

export const defineCertificate = (
  onRootDomain: boolean,
  rootDomain: string,
  subdomain?: string,
  options?: QPQConfigAdvancedCertificateSettings,
): CertificateQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.Certificate,
  uniqueKey: `${onRootDomain}${subdomain}`,

  onRootDomain,
  subdomain,
  rootDomain,
});
