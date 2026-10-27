import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { Configuration, IgnorePlugin, WebpackPluginInstance } from 'webpack';

import { getQpqBundleExternals } from './getQpqBundleExternals';
import { getWebpackBuildMode } from './getWebpackBuildMode';
import { QpqPlugin } from './plugins';

export const getWebpackConfig = (qpqConfig: QPQConfig, buildPath: string, entries: Record<string, string>, nodeModulePath: string): Configuration => {
  const bundleOptions = qpqCoreUtils.getBackendBundleOptions(qpqConfig);

  // `defineBackendBundleOptions`: optional requires inside dependencies that
  // should resolve to nothing instead of bundling (or warning).
  const ignoreModulePlugins: WebpackPluginInstance[] = bundleOptions.ignoreModules.map(
    (ignoreModule) =>
      new IgnorePlugin(
        ignoreModule.context
          ? { resourceRegExp: new RegExp(ignoreModule.resource), contextRegExp: new RegExp(ignoreModule.context) }
          : { resourceRegExp: new RegExp(ignoreModule.resource) },
      ),
  );

  return {
    entry: entries,

    mode: getWebpackBuildMode(qpqConfig),

    externals: [/aws-sdk/, ...getQpqBundleExternals(qpqConfig)],

    target: 'node',
    output: {
      // Output path
      path: buildPath,
      filename: '[name]/index.js',

      // Allow compiling as a lib ~ don't tree shake my exports plz
      globalObject: 'this',
      libraryTarget: 'commonjs2',
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      fallback: {},
    },

    plugins: [new QpqPlugin({ qpqConfigs: [qpqConfig], nodeModulePath }), ...ignoreModulePlugins],

    module: {
      rules: [
        {
          test: /\.(yaml|json)$/,
          type: 'asset/source',
          exclude: /node_modules/,
        },
      ],
    },

    ignoreWarnings: [
      {
        module: /@module-federation/,
        message: /Failed to parse source map/,
      },
      // `defineBackendBundleOptions`: known-noisy warnings from dependencies.
      ...bundleOptions.ignoreWarnings.map((ignoreWarning) => ({
        module: ignoreWarning.module ? new RegExp(ignoreWarning.module) : undefined,
        message: ignoreWarning.message ? new RegExp(ignoreWarning.message) : undefined,
      })),
    ],
  };
};

export const getAllWebpackConfig = (qpqConfig: QPQConfig, entries: Record<string, string>, outputPath?: string, nodeModulePath?: string) =>
  getWebpackConfig(qpqConfig, outputPath || 'build', entries, nodeModulePath || 'node_modules');
