import { SetupStep } from '../../../lib/setupStep';
import { buildAwsSetupContext } from './awsSetupContext';
import { buildBucketNamesStep } from './buildBucketNamesStep';
import { buildCdkBootstrapSteps } from './buildCdkBootstrapSteps';
import { buildGithubDeployRoleStep } from './buildGithubDeployRoleStep';
import { buildGithubOidcProviderStep } from './buildGithubOidcProviderStep';
import { buildHostedZonesStep } from './buildHostedZonesStep';
import { buildIamCapabilityStep } from './buildIamCapabilityStep';
import { buildIdentityStep } from './buildIdentityStep';
import { buildAccountStackStep, buildBootstrapStackStep, buildDomainStackStep } from './buildStackSteps';

/**
 * The AWS checklist, in the order it must run: prerequisites that only check, the CDK
 * toolkit per region, then the app-wide stacks (the account stack creates the GitHub OIDC
 * provider, the bootstrap stack the GitHub deploy role). Services are deployed separately
 * with `qpq go` / `qpq go:docker`, which is where the time goes and where parallelism lives.
 */
export const awsSetupSteps = async (appName: string, environment: string): Promise<SetupStep[]> => {
  const ctx = buildAwsSetupContext(appName, environment);

  return [
    buildIdentityStep(ctx),
    buildIamCapabilityStep(ctx),
    buildHostedZonesStep(ctx),
    buildBucketNamesStep(ctx),
    ...buildCdkBootstrapSteps(ctx),
    buildAccountStackStep(ctx),
    buildGithubOidcProviderStep(ctx),
    buildDomainStackStep(ctx),
    buildBootstrapStackStep(ctx),
    buildGithubDeployRoleStep(ctx),
  ];
};
