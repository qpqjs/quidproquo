import { isQpqFunctionRuntimeAdvanced, qpqCoreUtils } from '@qpqjs/core';

import path from 'path';

/**
 * Absolute source path for a QpqFunctionRuntime: basePath + relativePath for an
 * advanced runtime, config root + the src half of a `path::story` string otherwise.
 *
 * @param {import('@qpqjs/core').QpqFunctionRuntime} qpqFunctionRuntime
 * @param {import('@qpqjs/core').QPQConfig} qpqConfig
 * @returns {string}
 */
export const getFullSrcPathFromQpqFunctionRuntime = (qpqFunctionRuntime, qpqConfig) => {
  if (isQpqFunctionRuntimeAdvanced(qpqFunctionRuntime)) {
    return path.join(qpqFunctionRuntime.basePath, qpqFunctionRuntime.relativePath);
  }

  const [srcPath] = qpqFunctionRuntime.split('::');

  const configRoot = qpqCoreUtils.getConfigRoot(qpqConfig);

  return path.join(configRoot, srcPath);
};
