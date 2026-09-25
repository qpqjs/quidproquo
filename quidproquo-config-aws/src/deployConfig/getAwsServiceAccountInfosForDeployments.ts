import { QpqDeployEnvVar } from 'quidproquo-core';

import { ServiceAccountInfo } from '../types';
import { getQpqAppDeployment } from './getQpqAppDeployment';
import { validateAwsDeployment } from './validateAwsDeployment';

export type AwsServiceAccountInfosForDeploymentsOptions = {
  // Defaults to cwd (qpq and the CDK app always run from the workspace root) and the primed DEPLOY_APP_NAME.
  root?: string;
  appName?: string;
};

/**
 * The cross-deployment rows for `defineAwsServiceAccountInfo`: where each of `moduleNames`
 * lives in each named deployment of this app, read from deploy.config.json so account and
 * region are never repeated in code. Throws for an unknown or non-aws deployment. Evaluated
 * on the host at synth/build time only.
 */
export const getAwsServiceAccountInfosForDeployments = (
  deploymentNames: string[],
  moduleNames: string[],
  options: AwsServiceAccountInfosForDeploymentsOptions = {},
): ServiceAccountInfo[] => {
  const appName = options.appName ?? process.env[QpqDeployEnvVar.deployAppName];
  if (!appName) {
    throw new Error(`No app to read deployments for: pass options.appName or run under qpq so ${QpqDeployEnvVar.deployAppName} is set.`);
  }
  const root = options.root ?? process.cwd();

  return deploymentNames.flatMap((deploymentName) => {
    const deployment = validateAwsDeployment(deploymentName, getQpqAppDeployment(root, appName, deploymentName));

    return moduleNames.map((moduleName) => ({
      moduleName,
      environment: deployment.environment,
      feature: deployment.feature,
      awsAccountId: deployment.platformSettings.accountId,
      awsRegion: deployment.platformSettings.region,
    }));
  });
};
