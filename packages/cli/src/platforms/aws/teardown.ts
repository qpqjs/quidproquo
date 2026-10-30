// AWS sequential teardown (`qpq teardown`), the stack phases of `qpq go` in
// reverse. Per phase it destroys every selected service's web, then api, then
// inf CDK stacks. Phases don't cross-reference each other's CFN outputs
// (values flow through SSM), so this order is prudence, not a hard dependency.
// Bootstrap, domain and account stacks are deliberately out of scope, they
// outlive any one service and are torn down by hand if ever.
import { qpqDeployAwsUtils } from '@qpqjs/deploy-aws';

import { synthCommand } from '../../commands/synth';
import { TeardownPlan } from '../../lib/deployPrompts';
import { createOutput } from '../../lib/out';
import { loadServiceQpqConfig } from '../../lib/qpqConfigs';
import { logTimeEnd, logTimeStart } from '../../lib/timing';
import { isAwsCredentialsValid } from './awsCredentials';
import { destroyServiceStack } from './stacks';

const out = createOutput('aws:teardown');

const teardownPhases = [
  { label: 'Web', getStackName: qpqDeployAwsUtils.getWebStackName },
  { label: 'Api', getStackName: qpqDeployAwsUtils.getApiStackName },
  { label: 'Inf', getStackName: qpqDeployAwsUtils.getInfStackName },
];

export const awsTeardown = async (appName: string, plan: TeardownPlan): Promise<void> => {
  if (plan.kind === 'cancelled') {
    return;
  }

  const { services } = plan;

  out.log('\n\nRunning automated teardown\n\n');
  out.log('Executing for services');
  out.log(services.join(', '));

  if ((await isAwsCredentialsValid()) === false) {
    out.log('Credentials are expired or invalid.');
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
      out.log(`Destroy ${label}: `, service);
      await destroyServiceStack(service, getStackName(qpqConfigForService), appName);
    }, Promise.resolve());
  }

  logTimeEnd('totalTime');
};
