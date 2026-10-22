import { Configuration, rspack } from '@rspack/core';

// One-shot rspack build as a promise. Rejects on compiler error or stats
// errors so a failed bundle stops the run.
export const runRspack = (config: Configuration): Promise<void> =>
  new Promise((resolve, reject) => {
    rspack(config, (err, stats) => {
      if (err) return reject(err);
      if (stats?.hasErrors()) return reject(new Error(stats.toString({ errors: true, colors: false })));
      console.log(
        stats?.toString({
          colors: false,
          chunks: false,
          modules: false,
          assets: true,
        }),
      );
      return resolve();
    });
  });
