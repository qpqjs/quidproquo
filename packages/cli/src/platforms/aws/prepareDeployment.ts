import { primeAwsDeploymentEnv, validateAwsDeployment } from '@qpqjs/config-aws';
import { QpqAppDeployment } from '@qpqjs/core';

/** Checks the entry has an account and region, then primes AWS_DEFAULT_ACCOUNT / AWS_DEFAULT_REGION from it. */
export const awsPrepareDeployment = (deploymentName: string, deployment: QpqAppDeployment): void => {
  primeAwsDeploymentEnv(validateAwsDeployment(deploymentName, deployment));
};
