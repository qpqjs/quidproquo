import { QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export interface EmailReceivingDomainQPQWebServerConfigSetting extends QPQConfigSetting {
  subdomain: string;
}

/**
 * The app's receiving domain, one per root: `<subdomain>.<env>.<root>` resolved like every other
 * host. Declared in the bootstrap config, whose stack verifies the domain with the mail provider
 * and points its MX record at it, and again by every service that declares a defineEmailReceiver,
 * which resolves its recipients from it (the same way defineDns is declared in both).
 */
export const defineEmailReceivingDomain = (subdomain: string = 'inbox'): EmailReceivingDomainQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.EmailReceivingDomain,
  uniqueKey: 'emailReceivingDomain',

  subdomain,
});
