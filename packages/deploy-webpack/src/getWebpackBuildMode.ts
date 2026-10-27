import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

export type WebpackBuildMode = 'none' | 'development' | 'production';

// Maps the service's environment to a webpack mode. Single source of truth for
// the static lambda build, the federated remote build, and any other consumer -
// so they never optimize/minify differently.
export const getWebpackBuildMode = (qpqConfig: QPQConfig): WebpackBuildMode => {
  const moduleEnvironment = qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);

  if (moduleEnvironment === 'development' || moduleEnvironment === 'production') {
    return moduleEnvironment;
  }

  return 'production';
};
