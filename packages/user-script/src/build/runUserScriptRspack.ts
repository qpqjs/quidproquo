import type { Configuration } from '@rspack/core';

import { loadRspackModule } from './loadRspackModule';

/**
 * One-shot rspack build as a promise; rejects on a compiler error or on stats errors.
 * Kept here rather than imported from quidproquo-deploy-rspack because this package is
 * bundled into lambdas and must not pull that package's deploy-time dependencies in.
 */
export const runUserScriptRspack = async (config: Configuration): Promise<void> => {
  const { rspack } = await loadRspackModule();

  return new Promise((resolve, reject) => {
    rspack(config, (error, stats) => {
      if (error) return reject(error);
      if (stats?.hasErrors()) return reject(new Error(stats.toString({ errors: true, colors: false })));
      return resolve();
    });
  });
};
