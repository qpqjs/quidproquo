import { generateUuid, QPQConfig, qpqCoreUtils } from '@qpqjs/core';

export const getRuntimeCorrelation = (qpqConfig: QPQConfig): string => {
  const moduleName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
  return `${moduleName}::${generateUuid()}`;
};
