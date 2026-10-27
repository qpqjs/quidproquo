import { QPQConfig, QpqPureFunction } from 'quidproquo-core';
import { DomainResolver, qpqWebServerUtils } from 'quidproquo-webserver';

import path from 'path';

/** Loads the export a QpqPureFunction points at; the caller runs under ts-node, as every workspace tool does. */
export const requireQpqPureFunction = <T>(pointer: QpqPureFunction): T => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const loaded = require(path.join(pointer.basePath, pointer.relativePath));

  return loaded[pointer.functionName];
};

/**
 * The app's DomainResolver from the Dns setting's pointer, undefined for the default shape.
 * Synth and build only: the runtime never loads it (it reads the materialised table).
 */
export const requireDomainResolver = (qpqConfig: QPQConfig): DomainResolver | undefined => {
  const pointer = qpqWebServerUtils.getDnsConfig(qpqConfig)?.resolver;
  if (!pointer) {
    return undefined;
  }

  const resolver = requireQpqPureFunction<DomainResolver | undefined>(pointer);
  if (typeof resolver?.resolveHost !== 'function') {
    throw new Error(
      `${path.join(pointer.basePath, pointer.relativePath)} export [${pointer.functionName}] must be a DomainResolver ({ resolveHost })`,
    );
  }

  return resolver;
};
