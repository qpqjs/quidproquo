import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';

import { SetupCheckResult, SetupStep } from '../../../lib/setupStep';
import { AwsSetupContext } from './awsSetupContext';

// CDK bootstrap and every deploy create IAM roles. PowerUserAccess fails on the
// first iam:GetRole for a cdk-* role, so probe exactly that: a NoSuchEntity
// answer means the permission is there, AccessDenied means it is not.
const checkIamCapability = async (ctx: AwsSetupContext): Promise<SetupCheckResult> => {
  const roleName = `cdk-hnb659fds-cfn-exec-role-${ctx.accountId}-${ctx.region}`;
  try {
    await new IAMClient({ region: ctx.region }).send(new GetRoleCommand({ RoleName: roleName }));
    return { done: true, detail: 'iam:GetRole allowed' };
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    if (name === 'NoSuchEntityException') {
      return { done: true, detail: 'iam:GetRole allowed' };
    }
    return {
      done: false,
      detail: `iam:GetRole denied (${name}); the permission set needs IAM rights (AdministratorAccess or a custom set adding iam:*)`,
    };
  }
};

/** Check-only: the credentials can manage IAM, which every CDK deploy needs. */
export const buildIamCapabilityStep = (ctx: AwsSetupContext): SetupStep => ({
  id: 'iam',
  name: 'IAM rights on the credentials',
  check: () => checkIamCapability(ctx),
  run: async () => {
    const result = await checkIamCapability(ctx);
    if (!result.done) {
      throw new Error(result.detail ?? 'IAM rights missing');
    }
  },
});
