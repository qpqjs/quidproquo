import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

export type RspackBuildMode = 'none' | 'development' | 'production';

// Maps the service's environment to an rspack mode. Single source of truth for
// the static lambda build, the federated remote build, and any other consumer -
// so they never optimize/minify differently.
export const getRspackBuildMode = (qpqConfig: QPQConfig): RspackBuildMode => {
  const moduleEnvironment = qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);

  if (moduleEnvironment === 'development' || moduleEnvironment === 'production') {
    return moduleEnvironment;
  }

  return 'production';
};
