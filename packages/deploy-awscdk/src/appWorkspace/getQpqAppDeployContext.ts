import { getQpqAppDeployment, validateAwsDeployment } from 'quidproquo-config-aws';

import path from 'path';

import { QpqAppDeployContext } from './QpqAppDeployContext';

/** Builds the context the CDK app hands to config fragments. Throws for a non-AWS deployment, which never reaches CDK. */
export const getQpqAppDeployContext = (root: string, appName: string, deploymentName: string): QpqAppDeployContext => {
  const deployment = validateAwsDeployment(deploymentName, getQpqAppDeployment(root, appName, deploymentName));

  return {
    appName,
    appDir: path.join(root, 'apps', appName),

    deploymentName,

    name: deployment.name,
    environment: deployment.environment,
    feature: deployment.feature,
    settings: deployment.settings ?? {},

    accountId: deployment.platformSettings.accountId,
    region: deployment.platformSettings.region,
  } satisfies QpqAppDeployContext;
};
