import { QpqAppDeploySettings } from 'quidproquo-core';

/**
 * Deploy-time context handed to the app's account.qpq.ts / bootstrap.qpq.ts config
 * fragments. Only AWS deployments reach the CDK app, so the AWS identity is required.
 */
export type QpqAppDeployContext = {
  appName: string;
  appDir: string;

  deploymentName: string;

  name: string;
  environment: string;
  feature?: string;
  settings: QpqAppDeploySettings;

  accountId: string;
  region: string;
};
