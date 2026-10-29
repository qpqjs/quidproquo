import { qpqCoreUtils } from '@qpqjs/core';
import { qpqWebServerUtils } from '@qpqjs/webserver';

import { ResolvedDevServerConfig } from '../../types';
import { LocalEmailInbox } from './LocalEmailInbox';

/**
 * Every receiver across the dev server's services with the hosts it receives for, resolved the
 * way the deployed receipt rule resolves them (the app's receiving domain on each dns root).
 * A service with receivers but no receiving domain gets none, as its deploy would refuse.
 */
export const resolveLocalEmailInboxes = async (devServerConfig: ResolvedDevServerConfig): Promise<LocalEmailInbox[]> => {
  const inboxes: LocalEmailInbox[] = [];

  for (const qpqConfig of devServerConfig.qpqConfigs) {
    const receivers = qpqWebServerUtils.getOwnedEmailReceiverConfigs(qpqConfig);
    const receivingDomain = qpqWebServerUtils.getEmailReceivingDomainConfig(qpqConfig);
    if (receivers.length === 0 || !receivingDomain) {
      continue;
    }

    const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
    const resolver = await qpqWebServerUtils.loadDomainResolver(qpqConfig, (runtime) => devServerConfig.dynamicModuleLoader(serviceName, runtime));
    const hosts = qpqWebServerUtils.resolveHosts(qpqConfig, { subdomain: receivingDomain.subdomain }, resolver).map((host) => host.toLowerCase());

    for (const receiver of receivers) {
      inboxes.push({ serviceName, storageDriveName: receiver.storageDriveName, hosts });
    }
  }

  return inboxes;
};
