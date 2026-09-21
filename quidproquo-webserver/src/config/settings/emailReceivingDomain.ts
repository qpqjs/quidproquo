import { QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export interface EmailReceivingDomainQPQWebServerConfigSetting extends QPQConfigSetting {
  subdomain: string;
}

/**
 * The app's receiving domain, one per root: `<subdomain>.<env>.<root>` resolved like every other
 * host. Bootstrap config only; the bootstrap stack verifies the domain with the mail provider and
 * points its MX record at it. Every defineEmailReceiver in the app receives at this domain.
 */
export const defineEmailReceivingDomain = (subdomain: string = 'inbox'): EmailReceivingDomainQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.EmailReceivingDomain,
  uniqueKey: 'emailReceivingDomain',

  subdomain,
});
