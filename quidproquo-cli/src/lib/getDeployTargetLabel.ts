import { QpqDeployEnvVar } from 'quidproquo-core';

/** The resolved deployment as a human label for confirmations, e.g. `production (example-production)`. */
export const getDeployTargetLabel = (): string => {
  const env = process.env;
  const identity = [env[QpqDeployEnvVar.applicationName], env[QpqDeployEnvVar.environment], env[QpqDeployEnvVar.featureName]].filter(Boolean).join('-');
  return `${env[QpqDeployEnvVar.deployName]} (${identity})`;
};
