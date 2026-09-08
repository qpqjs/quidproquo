import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';

import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';

import { SetupCheckResult, SetupStep } from '../../../lib/setupStep';
import { AwsSetupContext } from './awsSetupContext';

// The role itself is deployed by the bootstrap stack; this step tells you whether the config
// declares it, whether it exists yet, and what to put in the GitHub Environment once it does.
const checkDeployRole = async (ctx: AwsSetupContext): Promise<SetupCheckResult> => {
  const config = qpqConfigAwsUtils.getAwsGithubDeployRoleConfig(ctx.bootstrapQpqConfig);
  if (!config) {
    return { done: false, detail: 'not declared: add defineAwsGithubDeployRole("owner/repo", { ownerId, repositoryId }) to bootstrap.qpq.ts' };
  }

  const roleName = awsNamingUtils.getGithubDeployRoleNameFromConfig(ctx.bootstrapQpqConfig);
  const githubEnvironment = config.githubEnvironment ?? ctx.environment;
  try {
    const { Role } = await new IAMClient({ region: ctx.region }).send(new GetRoleCommand({ RoleName: roleName }));
    return {
      done: true,
      detail: `${Role?.Arn}; GitHub Environment '${githubEnvironment}' needs DEPLOY_ROLE_ARN=<that arn> and AWS_REGION=${ctx.region}`,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'NoSuchEntityException') {
      return { done: false, detail: `${roleName} not deployed yet (the bootstrap stack creates it)` };
    }
    throw error;
  }
};

/** Check-only: the GitHub Actions deploy role is declared and deployed, with the values the GitHub Environment needs. */
export const buildGithubDeployRoleStep = (ctx: AwsSetupContext): SetupStep => ({
  id: 'github-deploy-role',
  name: 'GitHub Actions deploy role',
  check: () => checkDeployRole(ctx),
  run: async () => {
    const result = await checkDeployRole(ctx);
    if (!result.done) {
      throw new Error(result.detail ?? 'deploy role missing');
    }
    console.log(result.detail);
  },
});
