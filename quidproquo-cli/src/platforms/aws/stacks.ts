// Host-side `cdk deploy` helpers. No cdk.json anywhere: the CDK app command is
// passed via --app and runs quidproquo-deploy-awscdk's generic workspace app
// (bin/qpq-cdk-app.js) under ts-node hooks. The child inherits the primed
// deployment env (DEPLOY_APP_NAME / DEPLOY_NAME and everything resolveDeployment
// set); only the per-invocation service is added here.
import { QpqDeployEnvVar } from 'quidproquo-core';
import { qpqDeployAwsCdkUtils } from 'quidproquo-deploy-awscdk';

import path from 'path';

import { getRoot, getServiceNames } from '../../lib/discovery';
import { getAppPrefix, loadServiceQpqConfig } from '../../lib/qpqConfigs';
import { runCommand } from '../../lib/runCommand';
import { logTimeEnd, logTimeStart } from '../../lib/timing';
import { getCdkAppCommand } from './cdkApp';

export const deployStack = async (stackName: string, env: Record<string, string> = {}): Promise<void> => {
  logTimeStart(stackName);
  await runCommand(
    'npx',
    ['cdk', 'deploy', stackName, '--require-approval', 'never', '--app', `'${getCdkAppCommand()}'`, '--output', path.join('dist', 'qpq', 'cdk.out')],
    {
      cwd: getRoot(),
      env,
    },
  );
  logTimeEnd(stackName);
};

export const deployServiceStack = (serviceName: string, stackName: string, appName: string): Promise<void> =>
  deployStack(stackName, {
    DEPLOY_SERVICE_NAME: serviceName,
    DEPLOY_APP_NAME: appName,
  });

// `cdk destroy` still synths the app to find the stack, so it runs the same
// generic workspace app with the same DEPLOY_* env as deploys — meaning the
// service bundles under dist/ must exist for asset resolution to succeed.
export const destroyStack = async (stackName: string, env: Record<string, string> = {}): Promise<void> => {
  logTimeStart(stackName);
  await runCommand(
    'npx',
    ['cdk', 'destroy', stackName, '--force', '--app', `'${getCdkAppCommand()}'`, '--output', path.join('dist', 'qpq', 'cdk.out')],
    {
      cwd: getRoot(),
      env,
    },
  );
  logTimeEnd(stackName);
};

export const destroyServiceStack = (serviceName: string, stackName: string, appName: string): Promise<void> =>
  destroyStack(stackName, {
    DEPLOY_SERVICE_NAME: serviceName,
    DEPLOY_APP_NAME: appName,
  });

export const deployDomainStack = async (appName: string): Promise<void> => {
  const qpqConfig = loadServiceQpqConfig(appName, getServiceNames(appName)[0]);
  const stackName = qpqDeployAwsCdkUtils.getDomainStackName(qpqConfig);
  console.log('Deploy Domain: ', stackName);
  await deployStack(stackName, {
    DEPLOY_SERVICE_NAME: '',
    DEPLOY_APP_NAME: appName,
  });
};

// Account-level guardrails stack - statically named (one per AWS account,
// app-agnostic), so no config load is needed to know the name. Callers decide
// whether an actor deploy should include it (bootstrap skips it; the explicit
// 'account' menu option always deploys).
export const deployAccountStack = async (appName: string): Promise<void> => {
  const stackName = qpqDeployAwsCdkUtils.getAccountStackName();
  console.log('Deploy Account: ', stackName);
  await deployStack(stackName, {
    DEPLOY_SERVICE_NAME: '',
    DEPLOY_APP_NAME: appName,
  });
};

export const deployBootstrapStack = async (appName: string): Promise<void> => {
  const appPrefix = getAppPrefix(appName);
  const environment = process.env[QpqDeployEnvVar.environment];
  const feature = process.env[QpqDeployEnvVar.featureName];
  const stackName = feature ? `${appPrefix}-${environment}-${feature}-bs` : `${appPrefix}-${environment}-bs`;
  await deployStack(stackName, {
    DEPLOY_SERVICE_NAME: '',
    DEPLOY_APP_NAME: appName,
  });
};
