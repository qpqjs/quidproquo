// Rspack config for building a QPQ backend service as a MODULE FEDERATION REMOTE.
//
// Companion to getServiceRspackConfig: that one builds the per-handler lambda
// zips (the deployed code). This one builds the same service's story code as a
// single federated container (remoteEntry.js + expose/shared chunks) that gets
// published to the service's federated code bucket. Once published, deployed
// lambdas load their stories from the bucket instead of the bundled if-chain
// (the dynamicModuleLoader tries federation first, falls back to bundled).
//
// getRspackConfigForQpqRemote supplies target 'async-node', the
// ModuleFederationPlugin (exposes auto-derived from every QpqFunctionRuntime,
// quidproquo-core/webserver shared), and chunked output. On top we add the same
// swc-loader getServiceRspackConfig uses. We deliberately do NOT copy its
// splitChunks:false / eager-import settings: federation NEEDS async chunks.
import { QPQConfig } from 'quidproquo-core';

import path from 'path';
import { Configuration } from '@rspack/core';

import { getRspackConfigForQpqRemote } from '../federation';
import { parseServiceDir } from './parseServiceDir';
import { serviceTsRules } from './serviceTsRules';

export const getServiceRemoteRspackConfig = (qpqConfig: QPQConfig, serviceDir: string): Configuration => {
  const { root, appName, serviceName } = parseServiceDir(serviceDir, 'service');

  // Output goes to a `service-remote` sibling of the static `service` build so
  // the two never clobber each other.
  const remoteBuildPath = path.join(root, 'dist', 'apps', appName, 'services', serviceName, 'service-remote');

  const qpqRemote = getRspackConfigForQpqRemote(qpqConfig, remoteBuildPath);

  return {
    ...qpqRemote,

    resolve: {
      ...qpqRemote.resolve,
      extensions: ['.ts', '.tsx', '.js', '.json'],
    },

    module: {
      ...qpqRemote.module,
      rules: [...(qpqRemote.module?.rules ?? []), ...serviceTsRules()],
    },
  };
};
