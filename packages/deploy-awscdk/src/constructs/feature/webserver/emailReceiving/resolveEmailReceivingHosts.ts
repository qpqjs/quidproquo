import { QPQConfig } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { resolveDeployHostForRoot } from '../../../../utils/domain';

/** The receiving host per root (`inbox.development.example.com`), or none when the app declares no receiving domain. */
export const resolveEmailReceivingHosts = (qpqConfig: QPQConfig): { rootDomain: string; host: string }[] => {
  const receivingDomain = qpqWebServerUtils.getEmailReceivingDomainConfig(qpqConfig);
  if (!receivingDomain) {
    return [];
  }

  return qpqWebServerUtils.getRootDomains(qpqConfig).map((rootDomain) => ({
    rootDomain,
    host: resolveDeployHostForRoot(qpqConfig, rootDomain, { subdomain: receivingDomain.subdomain }),
  }));
};
