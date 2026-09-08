import { actionResult, createActionProcessor, DynamicModuleLoader, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { askDnsResolveHosts, qpqWebServerUtils } from 'quidproquo-webserver';

const getProcessDnsResolveHosts = async (qpqConfig: QPQConfig, loader: DynamicModuleLoader): Promise<ProcessorFor<typeof askDnsResolveHosts>> => {
  const domainResolver = await qpqWebServerUtils.loadDomainResolver(qpqConfig, loader);

  return async (target) => actionResult(qpqWebServerUtils.resolveHosts(qpqConfig, target, domainResolver));
};

export const getDnsResolveHostsActionProcessor = createActionProcessor(askDnsResolveHosts, getProcessDnsResolveHosts);
