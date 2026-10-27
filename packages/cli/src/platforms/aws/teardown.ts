// AWS sequential teardown (`qpq teardown`) — the stack phases of `qpq go` in
// reverse. Per phase it destroys every selected service's web, then api, then
// inf CDK stacks. Phases don't cross-reference each other's CFN outputs
// (values flow through SSM), so this order is prudence, not a hard dependency.
// Bootstrap, domain and account stacks are deliberately out of scope — they
// outlive any one service and are torn down by hand if ever.
import { qpqDeployAwsCdkUtils } from 'quidproquo-deploy-awscdk';

import { synthCommand } from '../../commands/synth';
import { TeardownPlan } from '../../lib/deployPrompts';
import { loadServiceQpqConfig } from '../../lib/qpqConfigs';
import { logTimeEnd, logTimeStart } from '../../lib/timing';
import { isAwsCredentialsValid } from './awsCredentials';
import { destroyServiceStack } from './stacks';

const teardownPhases = [
  { label: 'Web', getStackName: qpqDeployAwsCdkUtils.getWebStackName },
  { label: 'Api', getStackName: qpqDeployAwsCdkUtils.getApiStackName },
  { label: 'Inf', getStackName: qpqDeployAwsCdkUtils.getInfStackName },
];

export const awsTeardown = async (appName: string, plan: TeardownPlan): Promise<void> => {
  if (plan.kind === 'cancelled') {
    return;
  }

  const { services } = plan;

  console.log('\n\nRunning automated teardown\n\n');
  console.log('Executing for services');
  console.log(services.join(', '));

  if ((await isAwsCredentialsValid()) === false) {
    console.log('Credentials are expired or invalid.');
    return;
  }

  logTimeStart('totalTime');

  // The stack-name utils and the cdk app both read the synthed QPQ configs.
  await services.reduce(async (cur, service) => {
    await cur;
    await synthCommand([service, '--app', appName]);
  }, Promise.resolve());

  for (const { label, getStackName } of teardownPhases) {
    await services.reduce(async (cur, service) => {
      await cur;
      const qpqConfigForService = loadServiceQpqConfig(appName, service);
      console.log(`Destroy ${label}: `, service);
      await destroyServiceStack(service, getStackName(qpqConfigForService), appName);
    }, Promise.resolve());
  }

  logTimeEnd('totalTime');
};
