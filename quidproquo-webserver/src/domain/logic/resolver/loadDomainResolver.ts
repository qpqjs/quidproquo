import { DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getDnsConfig } from '../../../configUtils/dns/getDnsConfig';
import { DomainResolver } from '../../../domain/types/DomainResolver';
import { getDomainResolver } from './getDomainResolver';

/**
 * The resolver a runtime should use: the Dns setting's pointer loaded through the dynamic
 * module loader (the pointer is a src entry, so the bundler includes it), else the
 * localhost or default built-in. Processor factories call this once and close over it.
 */
export const loadDomainResolver = async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<DomainResolver> => {
  const pointer = getDnsConfig(qpqConfig)?.resolver;
  if (!pointer) {
    return getDomainResolver(qpqConfig);
  }

  const resolver = (await dynamicModuleLoader(pointer)) as DomainResolver | null;
  if (typeof resolver?.resolveHost !== 'function') {
    throw new Error(
      `Domain resolver [${pointer.functionName}] in [${pointer.basePath}/${pointer.relativePath}] must be a DomainResolver ({ resolveHost })`,
    );
  }

  return resolver;
};
