import { getQpqAppDeployment, primeAwsDeploymentEnv, primeDeploymentEnv, validateAwsDeployment } from 'quidproquo-config-aws';
import { QpqDeployEnvVar } from 'quidproquo-core';

import * as cdk from 'aws-cdk-lib';

import { createQPQApp } from '../QPQApp';
import {
  AccountQpqStack,
  ApiQpqServiceStack,
  BootstrapQpqServiceStack,
  DomainQpqServiceStack,
  InfQpqServiceStack,
  WebQpqServiceStack,
} from '../stacks';
import * as qpqDeployAwsCdkUtils from '../utils';
import { getQpqAppDeployContext } from './getQpqAppDeployContext';
import { getWorkspaceAccountQpqConfig, getWorkspaceBootstrapQpqConfig, getWorkspaceServiceQpqConfig } from './getWorkspaceQpqConfigs';

// The generic CDK app for a QPQ app workspace: the same stacks for every
// product; everything app-specific comes from apps/<app>/ (deploy.config.json
// + optional account.qpq.ts / bootstrap.qpq.ts fragments).
//
// Driven by two env vars set by the invoking tool (`qpq go`):
//   DEPLOY_APP_NAME      app folder under apps/
//   DEPLOY_NAME          deployment name in that app's deploy.config.json
// plus DEPLOY_SERVICE_NAME (optional) to also synth a service's inf/web/api
// stacks. Everything else (identity, environment, feature, settings) comes from
// the deployment entry, primed here before any service config is required.
export const createWorkspaceQpqCdkApp = (): cdk.App => {
  // qpq spawns cdk with cwd at the workspace root.
  const root = process.cwd();

  const deployAppName = process.env[QpqDeployEnvVar.deployAppName];
  if (!deployAppName) {
    throw new Error(`${QpqDeployEnvVar.deployAppName} environment variable is not set.`);
  }

  const deploymentName = process.env[QpqDeployEnvVar.deployName];
  if (!deploymentName) {
    throw new Error(`${QpqDeployEnvVar.deployName} environment variable is not set.`);
  }

  const deployment = validateAwsDeployment(deploymentName, getQpqAppDeployment(root, deployAppName, deploymentName));
  primeDeploymentEnv(deployAppName, deploymentName, deployment);
  primeAwsDeploymentEnv(deployment);
  const ctx = getQpqAppDeployContext(root, deployAppName, deploymentName);

  const app = createQPQApp();

  // Account-level guardrails - one statically named stack per AWS account,
  // independent of any app. Exactly one repo/config owns this per account, and
  // actor deploys must not deploy it.
  new AccountQpqStack(app, qpqDeployAwsCdkUtils.getAccountStackName(), {
    qpqConfig: getWorkspaceAccountQpqConfig(ctx),
  });

  // Bootstrapping stacks — deploy when their config changes.
  const bootstrapQpqConfig = getWorkspaceBootstrapQpqConfig(ctx);

  new DomainQpqServiceStack(app, qpqDeployAwsCdkUtils.getDomainStackName(bootstrapQpqConfig), {
    qpqConfig: bootstrapQpqConfig,
  });

  new BootstrapQpqServiceStack(app, qpqDeployAwsCdkUtils.getBootstrapStackName(bootstrapQpqConfig), {
    qpqConfig: bootstrapQpqConfig,
  });

  if (process.env.DEPLOY_SERVICE_NAME) {
    const qpqConfig = getWorkspaceServiceQpqConfig(root, deployAppName, process.env.DEPLOY_SERVICE_NAME);

    new InfQpqServiceStack(app, qpqDeployAwsCdkUtils.getInfStackName(qpqConfig), {
      qpqConfig,
    });
    new WebQpqServiceStack(app, qpqDeployAwsCdkUtils.getWebStackName(qpqConfig), {
      qpqConfig,
    });
    new ApiQpqServiceStack(app, qpqDeployAwsCdkUtils.getApiStackName(qpqConfig), {
      qpqConfig,
    });
  }

  return app;
};
