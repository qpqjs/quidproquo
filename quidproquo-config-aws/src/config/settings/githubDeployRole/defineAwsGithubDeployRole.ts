import { QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../../QPQConfig';

export type GithubRepository = {
  owner: string;
  name: string;
  // GitHub can issue subject claims with immutable numeric ids in place of names
  // (`repo:owner@123/name@456:...`); when known, both forms are trusted.
  ownerId?: number;
  repositoryId?: number;
};

export type QPQConfigAdvancedAwsGithubDeployRoleSettings = {
  ownerId?: number;
  repositoryId?: number;
  // The GitHub Environment the deploy job runs under. Defaults to the deploy environment.
  githubEnvironment?: string;
};

export interface AwsGithubDeployRoleQPQConfigSetting extends QPQConfigSetting {
  repository: GithubRepository;
  githubEnvironment?: string;
}

/**
 * The IAM role GitHub Actions assumes (OIDC) to deploy this app's environment. One per
 * bootstrap config; created by the bootstrap stack against the account's
 * `token.actions.githubusercontent.com` provider (defineAccountGithubOidcProvider). Trust is scoped
 * to `repo:<owner>/<name>:environment:<githubEnvironment>`, so the workflow job must declare
 * that `environment:`. The role carries AdministratorAccess: a deploy creates IAM roles.
 */
export const defineAwsGithubDeployRole = (
  repository: string,
  options?: QPQConfigAdvancedAwsGithubDeployRoleSettings,
): AwsGithubDeployRoleQPQConfigSetting => {
  const [owner, name, ...rest] = repository.split('/');
  if (!owner || !name || rest.length > 0) {
    throw new Error(`defineAwsGithubDeployRole expects "owner/name", got "${repository}"`);
  }

  return {
    configSettingType: QPQAwsConfigSettingType.awsGithubDeployRole,
    uniqueKey: 'githubDeployRole',

    repository: { owner, name, ownerId: options?.ownerId, repositoryId: options?.repositoryId },
    githubEnvironment: options?.githubEnvironment,
  };
};
