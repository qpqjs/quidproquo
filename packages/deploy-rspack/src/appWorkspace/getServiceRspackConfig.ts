// Rspack config for a QPQ backend service's static lambda bundles.
//
// getAllRspackConfig supplies entry (lambda handlers), target 'node',
// externals (aws-sdk + layer modules + `defineBackendBundleOptions`), output
// (commonjs2) and QpqPlugin. On top we add a TypeScript loader and force
// single-file lambda bundles. `@scope/*` resolves via workspace node_modules
// symlinks to built dist, so no tsconfig-paths plugin is needed.
import { getLambdaEntries } from 'quidproquo-actionprocessor-awslambda';
import { QPQConfig } from 'quidproquo-core';

import path from 'path';
import { Configuration } from '@rspack/core';

import { getAllRspackConfig } from '../getRspackConfigForQpq';
import { parseServiceDir } from './parseServiceDir';
import { serviceTsRules } from './serviceTsRules';

export const getServiceRspackConfig = (qpqConfig: QPQConfig, serviceDir: string): Configuration => {
  const { root, appName, serviceName } = parseServiceDir(serviceDir, 'service');
  const outputPath = path.join(root, 'dist', 'apps', appName, 'services', serviceName, 'service');
  const nodeModulePath = path.join(root, 'node_modules');

  const qpqRspack = getAllRspackConfig(qpqConfig, getLambdaEntries(), outputPath, nodeModulePath);

  return {
    ...qpqRspack,

    // Each lambda entry must be a single self-contained file: inline dynamic
    // imports (no async chunks) and don't extract shared/runtime chunks, so every
    // entry emits just <entry>/index.js with no sibling numbered chunk folders.
    optimization: { splitChunks: false, runtimeChunk: false },

    resolve: {
      ...qpqRspack.resolve,
      extensions: ['.ts', '.tsx', '.js', '.json'],
    },

    module: {
      ...qpqRspack.module,
      parser: { javascript: { dynamicImportMode: 'eager' } },
      rules: [...(qpqRspack.module?.rules ?? []), ...serviceTsRules()],
    },
  };
};
