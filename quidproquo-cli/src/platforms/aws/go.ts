// AWS sequential deploy (`qpq go`). Per service it: synths the QPQ config,
// rspack-bundles the backend (programmatic — no per-service rspack.config.ts),
// deploys the inf/api/web CDK stacks (cdk runs the generic workspace app via
// --app), bundles views (rspack, production) and syncs them to S3. Finally, any
// service that opts into module federation has its federated remote published
// (built + uploaded + manifest flipped), so a deploy that ships new backend
// code also republishes the code the lambdas federate.
import { QpqDeployEnvVar } from 'quidproquo-core';
import { qpqDeployAwsCdkUtils } from 'quidproquo-deploy-awscdk';
import { getServiceRspackConfig } from 'quidproquo-deploy-rspack';

import path from 'path';

import { synthCommand } from '../../commands/synth';
import { DeployPlan } from '../../lib/deployPrompts';
import { getServiceDirectory, getServiceNamesWithViews } from '../../lib/discovery';
import { runAppHook } from '../../lib/hooks';
import { getServiceNamesWithFederation, loadServiceQpqConfig } from '../../lib/qpqConfigs';
import { runRspack } from '../../lib/rspackRun';
import { runCommand } from '../../lib/runCommand';
import { logTimeEnd, logTimeStart } from '../../lib/timing';
import { bundleViews } from '../../lib/views';
import { isAwsCredentialsValid } from './awsCredentials';
import { awsPublish } from './publish';
import { deployAccountStack, deployBootstrapStack, deployDomainStack, deployServiceStack } from './stacks';
import { syncViewsToS3 } from './viewsSync';

const buildAndDeploy = async (
  serviceName: string,
  needsSynth: boolean,
  needsBuildApi: boolean,
  needsInfStack: boolean,
  needsApiStack: boolean,
  needsWebStack: boolean,
  needsViewStack: boolean,
  appName: string,
): Promise<void> => {
  if (needsSynth) {
    console.log('Synth QPQ Configs');
    await synthCommand([serviceName, '--app', appName]);
  }

  const qpqConfigForService = loadServiceQpqConfig(appName, serviceName);

  if (needsBuildApi) {
    console.log('Building Api: ', serviceName);
    await runRspack(getServiceRspackConfig(qpqConfigForService, path.join(getServiceDirectory(appName, serviceName), 'service')));
  }

  if (needsInfStack) {
    console.log('Deploy Inf: ', serviceName);
    await deployServiceStack(serviceName, qpqDeployAwsCdkUtils.getInfStackName(qpqConfigForService), appName);
  }

  if (needsApiStack) {
    console.log('Deploy Api: ', serviceName);
    await deployServiceStack(serviceName, qpqDeployAwsCdkUtils.getApiStackName(qpqConfigForService), appName);
  }

  if (needsWebStack) {
    console.log('Deploy Web: ', serviceName);
    await deployServiceStack(serviceName, qpqDeployAwsCdkUtils.getWebStackName(qpqConfigForService), appName);
  }

  if (needsViewStack && getServiceNamesWithViews(appName).includes(serviceName)) {
    console.log('Building Views: ', serviceName);
    await bundleViews(appName, serviceName);
    await syncViewsToS3(appName, serviceName);
  }
};

export const awsGo = async (appName: string, plan: DeployPlan): Promise<void> => {
  if (plan.kind === 'cancelled') {
    return;
  }

  logTimeStart('totalTime');

  if (plan.kind === 'account') {
    await deployAccountStack(plan.appName);
    logTimeEnd('totalTime');
    return;
  }

  if (plan.kind === 'bootstrap') {
    // Feature bootstraps deploy into a shared account — leave the account-level
    // guardrails stack alone (deploy it explicitly via the 'account' option).
    if (process.env[QpqDeployEnvVar.featureName]) {
      console.log('Skipping account stack for feature deploy');
    } else {
      await deployAccountStack(plan.appName);
    }
    if (plan.includeDomain) {
      await deployDomainStack(plan.appName);
    }
    await deployBootstrapStack(plan.appName);
    logTimeEnd('totalTime');
    return;
  }

  const { services, stacks } = plan;
  const shouldBuildApi = stacks !== 'views';

  console.log('\n\nRunning automated deploy\n\n');
  console.log('Executing for services');
  console.log(services.join(', '));

  if ((await isAwsCredentialsValid()) === false) {
    console.log('Credentials are expired or invalid.');
    return;
  }

  const allStacks = stacks === 'all';

  await runAppHook(appName, 'predeploy');

  // Workspace packages resolve through their built dist/ (package.json main),
  // so bundles would ship stale code unless every lib is tsc'd first.
  console.log('Building workspace packages');
  await runCommand('npm', ['run', 'build', '--workspaces', '--if-present']);

  // Views uploads resolve bucket names from the shell service's config.
  if (allStacks || stacks === 'views') {
    await synthCommand(['shell', '--app', appName]);
  }

  for (let phase = 0; phase <= 5; phase += 1) {
    await services.reduce(async (cur, service) => {
      await cur;
      return buildAndDeploy(
        service,
        phase === 0,
        phase === 1 && shouldBuildApi,
        phase === 2 && (allStacks || stacks === 'inf'),
        phase === 3 && (allStacks || stacks === 'api'),
        phase === 4 && (allStacks || stacks === 'web'),
        phase === 5 && (allStacks || stacks === 'views'),
        appName,
      );
    }, Promise.resolve());
  }

  // Publishing federated remotes only matters once the new backend code is
  // live, so it's gated on the api stack having been (re)deployed. Services
  // without defineFederatedModuleStore(...) are skipped.
  if (allStacks || stacks === 'api') {
    const federatedServices = getServiceNamesWithFederation(appName, services);
    if (federatedServices.length > 0) {
      console.log('\n\nPublishing federated backends\n');
      await awsPublish(appName, federatedServices);
    }
  }

  logTimeEnd('totalTime');
};
