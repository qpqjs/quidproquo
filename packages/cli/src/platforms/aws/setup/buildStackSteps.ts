import { qpqDeployAwsCdkUtils } from 'quidproquo-deploy-awscdk';

import { SetupStep } from '../../../lib/setupStep';
import { deployAccountStack, deployBootstrapStack, deployDomainStack } from '../stacks';
import { AwsSetupContext } from './awsSetupContext';
import { describeStackStatus, isStackHealthy } from './describeStackStatus';

const buildStackStep = (id: string, name: string, stackName: string, region: string, run: () => Promise<void>): SetupStep => ({
  id,
  name: `${name} (${stackName})`,
  check: async () => {
    const status = await describeStackStatus(stackName, region);
    return status === null ? { done: false, detail: 'not deployed' } : { done: isStackHealthy(status), detail: status };
  },
  run,
});

export const buildAccountStackStep = (ctx: AwsSetupContext): SetupStep =>
  buildStackStep('account-stack', 'Account guardrails stack', qpqDeployAwsCdkUtils.getAccountStackName(), ctx.region, () =>
    deployAccountStack(ctx.appName),
  );

// The domain stack deploys its cert stacks as dependencies, so one step covers certificates too.
export const buildDomainStackStep = (ctx: AwsSetupContext): SetupStep =>
  buildStackStep(
    'domain-stack',
    'Domain stack: certificates + api domains',
    qpqDeployAwsCdkUtils.getDomainStackName(ctx.bootstrapQpqConfig),
    ctx.region,
    () => deployDomainStack(ctx.appName),
  );

export const buildBootstrapStackStep = (ctx: AwsSetupContext): SetupStep =>
  buildStackStep(
    'bootstrap-stack',
    'Bootstrap stack: WAF and app-wide resources',
    qpqDeployAwsCdkUtils.getBootstrapStackName(ctx.bootstrapQpqConfig),
    ctx.region,
    () => deployBootstrapStack(ctx.appName),
  );
