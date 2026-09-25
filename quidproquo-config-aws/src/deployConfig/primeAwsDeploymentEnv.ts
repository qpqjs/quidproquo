import { QpqAwsAppDeployment, QpqAwsDeployEnvVar } from './types';

/** Writes the AWS identity into process.env for service configs and the CDK app. Sets unconditionally, like `primeDeploymentEnv`. */
export const primeAwsDeploymentEnv = (deployment: QpqAwsAppDeployment): void => {
  process.env[QpqAwsDeployEnvVar.accountId] = deployment.platformSettings.accountId;
  process.env[QpqAwsDeployEnvVar.region] = deployment.platformSettings.region;
};
