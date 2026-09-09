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
  // Also trust the name-form subject (`repo:owner/name:...`). Off once ids are given: a
  // name can be re-earned by whoever next owns it, an id cannot. Turn on only for a
  // repository GitHub has not switched to immutable subjects yet (check the real subject
  // in CloudTrail: `repo:owner/name:...` means not switched).
  trustNameForm?: boolean;
};

export interface AwsGithubDeployRoleQPQConfigSetting extends QPQConfigSetting {
  repository: GithubRepository;
  githubEnvironment?: string;
  trustNameForm: boolean;
}

/**
 * The IAM role GitHub Actions assumes (OIDC) to deploy this app's environment. One per
 * bootstrap config; created by the bootstrap stack against the account's
 * `token.actions.githubusercontent.com` provider (defineAccountGithubOidcProvider). Trust is scoped
 * to the repository's immutable-id subject for `environment:<githubEnvironment>` (the name form
 * only when no ids are given or `trustNameForm` is set), so the workflow job must declare that
 * `environment:`. Permissions are what a deploy needs and nothing more: assume the CDK bootstrap
 * roles (CloudFormation itself runs as the exec role) and write this app's S3 buckets.
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
    trustNameForm: options?.trustNameForm ?? (options?.ownerId === undefined || options?.repositoryId === undefined),
  };
};
