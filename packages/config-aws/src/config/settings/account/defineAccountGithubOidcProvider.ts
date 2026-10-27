import { QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../../QPQConfig';

export type AccountGithubOidcProviderQPQConfigSetting = QPQConfigSetting;

/**
 * The account's GitHub Actions OpenID Connect provider (`token.actions.githubusercontent.com`),
 * which every app's `defineAwsGithubDeployRole` trusts. One per AWS account, so it lives in the
 * account config and the account stack; a provider created by hand must be deleted before the
 * stack can own it.
 */
export const defineAccountGithubOidcProvider = (): AccountGithubOidcProviderQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.accountGithubOidcProvider,
  uniqueKey: 'accountGithubOidcProvider',
});
