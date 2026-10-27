import { qpqCoreUtils } from '@qpqjs/core';

import { getSrcLoaderForQpqConfig } from './getSrcLoaderForQpqConfig';

export function getModuleLoaderSrcForService(qpqConfig, serviceNameVariableName, moduleNameVariableName, alwaysBundleStoryCode) {
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  const result = `
    if (${serviceNameVariableName} === String.raw\`${serviceName}\`) {
      ${getSrcLoaderForQpqConfig(qpqConfig, moduleNameVariableName, alwaysBundleStoryCode)}
    }
  `;

  return result;
}
