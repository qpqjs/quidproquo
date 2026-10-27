import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { randomGuid } from '../../awsLambdaUtils';

export const getRuntimeCorrelation = (qpqConfig: QPQConfig): string => {
  const moduleName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
  return `${moduleName}::${randomGuid()}`;
};
