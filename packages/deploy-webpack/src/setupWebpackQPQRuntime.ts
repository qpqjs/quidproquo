import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import path from 'path';

/**
 * Serialises the loader config (src entries, config root, custom action
 * processor sources, email templates) onto process.env.QPQLoaderConfig so
 * build-time loaders in consumer apps can read it back without importing
 * anything from this package.
 */
export const setupWebpackQPQRuntime = (qpqConfig: QPQConfig, buildPath: string): void => {
  const allSrcEntries = [...qpqCoreUtils.getAllSrcEntries(qpqConfig), ...qpqWebServerUtils.getAllSrcEntries(qpqConfig)];

  const customActionProcessorSources = qpqCoreUtils.getActionProcessorSources(qpqConfig);

  process.env.QPQLoaderConfig = JSON.stringify({
    allSrcEntries,
    rootDir: path.resolve(buildPath, '..'),
    qpqConfig,
    customActionProcessorSources,
    projectRoot: qpqCoreUtils.getConfigRoot(qpqConfig),
    userDirectoryEmailTemplates: qpqCoreUtils.getUserDirectoryEmailTemplates(qpqConfig),
  });
};
