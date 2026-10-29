import { QpqDeployEnvVar } from '@qpqjs/core';

// The env a cdk run reads its app and (optionally) service from; the deployment itself was
// primed into the environment by resolveDeployment and is inherited.
export const getDeployEnv = (appName: string, serviceName: string = ''): Record<string, string> => ({
  [QpqDeployEnvVar.deployServiceName]: serviceName,
  [QpqDeployEnvVar.deployAppName]: appName,
});
