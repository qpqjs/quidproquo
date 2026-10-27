import { qpqConfigAwsUtils } from 'quidproquo-config-aws';

import { GetOpenIDConnectProviderCommand, IAMClient } from '@aws-sdk/client-iam';

import { SetupCheckResult, SetupStep } from '../../../lib/setupStep';
import { AwsSetupContext } from './awsSetupContext';

// The provider is created by the account stack (defineAccountGithubOidcProvider in
// account.qpq.ts), so this only reports: declared or not, present or not.
const checkProvider = async (ctx: AwsSetupContext): Promise<SetupCheckResult> => {
  const declared = qpqConfigAwsUtils.isAccountGithubOidcProviderDeclared(ctx.accountQpqConfig);
  const arn = qpqConfigAwsUtils.getGithubOidcProviderArn(ctx.accountId);

  let exists = false;
  try {
    await new IAMClient({ region: ctx.region }).send(new GetOpenIDConnectProviderCommand({ OpenIDConnectProviderArn: arn }));
    exists = true;
  } catch (error) {
    if (!(error instanceof Error && error.name === 'NoSuchEntityException')) {
      throw error;
    }
  }

  if (!declared) {
    return {
      done: false,
      detail: exists
        ? `${arn} exists but account.qpq.ts does not declare it: add defineAccountGithubOidcProvider() and delete the hand-made provider before deploying the account stack`
        : 'not declared: add defineAccountGithubOidcProvider() to account.qpq.ts (the account stack creates it)',
    };
  }

  return exists ? { done: true, detail: arn } : { done: false, detail: 'declared, not deployed yet (the account stack creates it)' };
};

/** Check-only: the account's GitHub Actions OIDC provider is declared in account.qpq.ts and deployed. */
export const buildGithubOidcProviderStep = (ctx: AwsSetupContext): SetupStep => ({
  id: 'github-oidc-provider',
  name: 'GitHub Actions OIDC provider',
  check: () => checkProvider(ctx),
  run: async () => {
    const result = await checkProvider(ctx);
    if (!result.done) {
      throw new Error(result.detail ?? 'provider missing');
    }
  },
});
