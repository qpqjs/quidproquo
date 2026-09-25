import { QpqAppDeployment } from 'quidproquo-core';

import { AWS_DEPLOY_PLATFORM } from './AWS_DEPLOY_PLATFORM';
import { QpqAwsAppDeployment } from './types';

const REQUIRED_KEYS = ['accountId', 'region'] as const;

/** Narrows a deployment to an AWS one, throwing when it targets another platform or lacks an account or region. */
export const validateAwsDeployment = (deploymentName: string, deployment: QpqAppDeployment): QpqAwsAppDeployment => {
  if (deployment.platform !== AWS_DEPLOY_PLATFORM) {
    throw new Error(`Deployment '${deploymentName}' targets '${deployment.platform}', not ${AWS_DEPLOY_PLATFORM}.`);
  }

  const missing = REQUIRED_KEYS.filter((key) => !deployment.platformSettings?.[key]);
  if (missing.length > 0) {
    throw new Error(
      `Invalid aws deployment '${deploymentName}':\n  - ${missing.map((key) => `"platformSettings.${key}" must be a non-empty string`).join('\n  - ')}`,
    );
  }

  return deployment as QpqAwsAppDeployment;
};
