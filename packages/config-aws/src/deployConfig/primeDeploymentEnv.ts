import { getDeploySettingEnvName, QpqAppDeployment, QpqDeployEnvVar } from 'quidproquo-core';

/**
 * Writes a deployment into process.env for everything loaded afterwards (service configs,
 * fragments, child processes). Sets unconditionally: deploy.config.json is the source of
 * truth, so a value already in the shell never wins. A feature var left over from another
 * deployment is cleared rather than inherited. Platform identity is primed separately
 * (`primeAwsDeploymentEnv`).
 */
export const primeDeploymentEnv = (appName: string, deploymentName: string, deployment: QpqAppDeployment): void => {
  process.env[QpqDeployEnvVar.deployAppName] = appName;
  process.env[QpqDeployEnvVar.deployName] = deploymentName;

  process.env[QpqDeployEnvVar.applicationName] = deployment.name;
  process.env[QpqDeployEnvVar.environment] = deployment.environment;

  if (deployment.feature) {
    process.env[QpqDeployEnvVar.featureName] = deployment.feature;
  } else {
    delete process.env[QpqDeployEnvVar.featureName];
  }

  for (const [key, value] of Object.entries(deployment.settings ?? {})) {
    process.env[getDeploySettingEnvName(key)] = value;
  }
};
