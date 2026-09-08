import { qpqConfigAwsUtils } from 'quidproquo-config-aws';

import { getRoot } from '../../../lib/discovery';
import { runCommand } from '../../../lib/runCommand';
import { SetupStep } from '../../../lib/setupStep';
import { AwsSetupContext } from './awsSetupContext';
import { describeStackStatus, isStackHealthy } from './describeStackStatus';

/** Every region the app deploys into: the deploy region plus each certificate region (us-east-1 for CloudFront). */
export const getSetupRegions = (ctx: AwsSetupContext): string[] => [
  ...new Set([ctx.region, ...qpqConfigAwsUtils.getDomainCertificateConfigs(ctx.bootstrapQpqConfig).map((cert) => cert.region)]),
];

const buildCdkBootstrapStep = (ctx: AwsSetupContext, region: string): SetupStep => ({
  id: `cdk-bootstrap-${region}`,
  name: `CDK bootstrap ${region}`,
  check: async () => {
    const status = await describeStackStatus('CDKToolkit', region);
    if (status === null) {
      return { done: false, detail: 'no CDKToolkit stack' };
    }
    return isStackHealthy(status)
      ? { done: true, detail: `CDKToolkit ${status}` }
      : { done: false, detail: `CDKToolkit is ${status}; delete the stack in ${region} before retrying` };
  },
  run: () => runCommand('npx', ['cdk', 'bootstrap', `aws://${ctx.accountId}/${region}`], { cwd: getRoot() }),
});

export const buildCdkBootstrapSteps = (ctx: AwsSetupContext): SetupStep[] => getSetupRegions(ctx).map((region) => buildCdkBootstrapStep(ctx, region));
