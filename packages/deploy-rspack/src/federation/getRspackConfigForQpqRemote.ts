// ─────────────────────────────────────────────────────────────────────────────
// The rspack config that compiles a service's story code into a module-federation
// REMOTE container (remoteEntry.js + expose/shared chunks). This is step 2 of the
// build/publish flow:
//   1. getFederatedRemoteInfoForQpqConfig -> container name + exposes
//   2. getRspackConfigForQpqRemote (HERE) -> the container build in `buildPath`
//   3. publishFederatedRemote -> hash + manifest, ready to copy into the store bucket
//
// This is the counterpart to getRspackConfig (the normal per-handler lambda
// build). The container is `target: async-node` + a commonjs-module library so the
// lambda can require() it from /tmp, and `shared` keeps the framework packages OUT of
// the bundle (the host provides them), so a remote carries only user code.
// ─────────────────────────────────────────────────────────────────────────────
import { FEDERATED_SHARED_PACKAGE_NAMES, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { Configuration, IgnorePlugin } from '@rspack/core';

import { getQpqBundleExternals } from '../getQpqBundleExternals';
import { getRspackBuildMode } from '../getRspackBuildMode';
import { getQpqCircularCheckPlugin } from '../plugins';
import { getFederatedRemoteInfoForQpqConfig } from './getFederatedRemoteInfoForQpqConfig';

// The framework packages the lambda host provides as MF singletons. Built from the
// same list the host uses (getHostSharedModules) so the two can't drift, which would
// otherwise make the remote bundle its own copy and break singleton guarantees.
const getSharedFrameworkModules = (): Record<string, { singleton: true; requiredVersion: false }> =>
  Object.fromEntries(FEDERATED_SHARED_PACKAGE_NAMES.map((name) => [name, { singleton: true as const, requiredVersion: false as const }]));

// Builds the service's story code as a module federation remote container - the thing
// publishFederatedRemote packages and the lambda-side loadFederatedStory consumes.
// Everything the stories import is bundled in EXCEPT the framework packages listed in
// `shared`, which the lambda host provides so both sides use the same module instances.
//
// Like getRspackConfig, this config has no TS loader rule - consumer apps append the
// same module rules they use for their main qpq build.
export const getRspackConfigForQpqRemote = (qpqConfig: QPQConfig, buildPath: string): Configuration => {
  const { containerName, exposes } = getFederatedRemoteInfoForQpqConfig(qpqConfig);
  const bundleOptions = qpqCoreUtils.getBackendBundleOptions(qpqConfig);

  // `defineBackendBundleOptions`: optional requires inside dependencies that
  // should resolve to nothing instead of bundling (or warning).
  const ignoreModulePlugins = bundleOptions.ignoreModules.map(
    (ignoreModule) =>
      new IgnorePlugin({
        resourceRegExp: new RegExp(ignoreModule.resource),
        contextRegExp: ignoreModule.context ? new RegExp(ignoreModule.context) : undefined,
      }),
  );

  return {
    // The federation container is the only entry - the exposes drive the module graph
    entry: {},

    mode: getRspackBuildMode(qpqConfig),

    // The remote runs inside the lambda, so environment-provided packages
    // (layer modules + configured externals) stay out of the container too.
    externals: getQpqBundleExternals(qpqConfig),

    // Remotes ship S3 -> lambda /tmp, never over the wire to a browser, so size is not
    // user-facing. Full source maps (with sourcesContent) and unmangled identifiers are
    // what lets the trace-replay tooling map execution back to original TS lines and
    // report locals under their real names (see trace-replay-plan.md).
    devtool: 'source-map',
    optimization: {
      minimize: false,

      // Dedupe modules shared across exposes into their own chunks. The defaults
      // (20KB minSize, capped request counts) leave a copy of common user/vendor code
      // inside every expose chunk, so the store carries N copies and every loadRemote
      // re-parses the same code. Chunks here are require()d from /tmp, not fetched over
      // HTTP, so split aggressively: a shared chunk downloads and parses once per lambda
      // container, and an expose chunk carries only its own code.
      splitChunks: {
        // Expose chunks are async chunks; remoteEntry itself must stay whole.
        chunks: 'async',
        // Any shared module is worth extracting - there's no browser round-trip to amortise.
        minSize: 1,
        // No HTTP request-count pressure on disk requires.
        maxAsyncRequests: Infinity,
        cacheGroups: {
          // Bundled dependencies (not MF-shared, not externals) - split even when only
          // one expose uses them, so expose chunks stay user-code-only.
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          // User code imported by two or more exposes.
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    },

    // async-node chunk loading resolves sibling chunks from the entry's own directory
    // at runtime, which is what lets the container run from the lambda's /tmp cache
    target: 'async-node',

    output: {
      path: buildPath,
      publicPath: 'auto',
      filename: '[name].js',
      chunkFilename: '[id]-[contenthash].js',
      uniqueName: containerName,
      globalObject: 'this',
      clean: true,
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      fallback: {},
    },

    plugins: [
      new ModuleFederationPlugin({
        name: containerName,
        filename: 'remoteEntry.js',
        exposes,
        library: { type: 'commonjs-module', name: containerName },
        remoteType: 'script',
        runtimePlugins: [require.resolve('@module-federation/node/runtimePlugin')],
        shared: getSharedFrameworkModules(),
        // No consumer imports these remotes by type, and the DTS fork crashes trying
        // to resolve a rootDir from the programmatic build's tsconfig - so skip type
        // generation entirely (publishFederatedRemote drops @mf-types anyway).
        dts: false,
      }),
      getQpqCircularCheckPlugin(),
      ...ignoreModulePlugins,
    ],

    module: {
      rules: [
        {
          test: /\.(yaml|json)$/,
          type: 'asset/source',
          exclude: /node_modules/,
        },
        {
          // Chain source maps from COMPILED dependencies (org libs shipping .js + .js.map)
          // into the remote's output map, so execution traces show their original TS
          // instead of tsc output. Libs get full source text in traces only when their
          // maps embed it (tsc: sourceMap + inlineSources); otherwise traces still get
          // the original file/line names.
          test: /\.js$/,
          enforce: 'pre',
          // our own loader (see src/loaders), resolved from THIS package so consumer
          // hoisting layout doesn't matter
          use: [require.resolve('../loaders/sourceMapLoader')],
        },
      ],
    },

    ignoreWarnings: [
      {
        module: /@module-federation/,
        message: /Failed to parse source map/,
      },
      // the source-map rule runs over all node_modules js; third-party packages with
      // broken/unresolvable maps are expected and harmless (their code just stays as-is)
      {
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
