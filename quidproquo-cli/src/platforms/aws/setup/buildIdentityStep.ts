import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

import { SetupCheckResult, SetupStep } from '../../../lib/setupStep';
import { AwsSetupContext } from './awsSetupContext';

const checkIdentity = async (ctx: AwsSetupContext): Promise<SetupCheckResult> => {
  try {
    const { Account, Arn } = await new STSClient({ region: ctx.region }).send(new GetCallerIdentityCommand({}));
    if (Account !== ctx.accountId) {
      return { done: false, detail: `credentials are for account ${Account}, environment '${ctx.environment}' deploys to ${ctx.accountId}` };
    }
    return { done: true, detail: `${Arn}` };
  } catch (error) {
    return { done: false, detail: `no valid credentials: ${error instanceof Error ? error.message : String(error)}` };
  }
};

/** Check-only: the active credentials belong to the environment's account. Catches a stale .env or SSO profile. */
export const buildIdentityStep = (ctx: AwsSetupContext): SetupStep => ({
  id: 'identity',
  name: `Credentials for account ${ctx.accountId}`,
  check: () => checkIdentity(ctx),
  run: async () => {
    const result = await checkIdentity(ctx);
    if (!result.done) {
      throw new Error(`${result.detail}. Log in to the right account (or fix AWS_DEFAULT_ACCOUNT / deploy.config.json) and rerun.`);
    }
  },
});
