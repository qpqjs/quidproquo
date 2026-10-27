import { isQpqFunctionRuntimeAdvanced, qpqCoreUtils } from 'quidproquo-core';

import path from 'path';

/**
 * Absolute source path for a QpqFunctionRuntime: basePath + relativePath for an
 * advanced runtime, config root + the src half of a `path::story` string otherwise.
 *
 * @param {import('quidproquo-core').QpqFunctionRuntime} qpqFunctionRuntime
 * @param {import('quidproquo-core').QPQConfig} qpqConfig
 * @returns {string}
 */
export const getFullSrcPathFromQpqFunctionRuntime = (qpqFunctionRuntime, qpqConfig) => {
  if (isQpqFunctionRuntimeAdvanced(qpqFunctionRuntime)) {
    return path.join(qpqFunctionRuntime.basePath, qpqFunctionRuntime.relativePath);
  }

  const [srcPath] = qpqFunctionRuntime.split('::');

  const configRoot = qpqCoreUtils.getApplicationConfigRoot(qpqConfig);

  return path.join(configRoot, srcPath);
};
