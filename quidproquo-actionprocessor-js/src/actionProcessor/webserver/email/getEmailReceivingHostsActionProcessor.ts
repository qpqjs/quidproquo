import { actionResult, createActionProcessor, DynamicModuleLoader, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { askEmailReceivingHosts, qpqWebServerUtils } from 'quidproquo-webserver';

const getProcessEmailReceivingHosts = async (
  qpqConfig: QPQConfig,
  loader: DynamicModuleLoader,
): Promise<ProcessorFor<typeof askEmailReceivingHosts>> => {
  const receivingDomain = qpqWebServerUtils.getEmailReceivingDomainConfig(qpqConfig);
  const domainResolver = await qpqWebServerUtils.loadDomainResolver(qpqConfig, loader);

  return async () =>
    actionResult(receivingDomain ? qpqWebServerUtils.resolveHosts(qpqConfig, { subdomain: receivingDomain.subdomain }, domainResolver) : []);
};

export const getEmailReceivingHostsActionProcessor = createActionProcessor(askEmailReceivingHosts, getProcessEmailReceivingHosts);
