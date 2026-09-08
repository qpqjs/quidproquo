import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../../QPQConfig';
import { defineAwsGithubDeployRole } from './defineAwsGithubDeployRole';

describe('defineAwsGithubDeployRole', () => {
  it('splits the repository and carries the ids and environment', () => {
    expect(defineAwsGithubDeployRole('qpqjs/quidproquo', { ownerId: 1, repositoryId: 2, githubEnvironment: 'dev' })).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsGithubDeployRole,
      uniqueKey: 'githubDeployRole',
      repository: { owner: 'qpqjs', name: 'quidproquo', ownerId: 1, repositoryId: 2 },
      githubEnvironment: 'dev',
    });
  });

  it('rejects anything that is not owner/name', () => {
    expect(() => defineAwsGithubDeployRole('quidproquo')).toThrow('owner/name');
    expect(() => defineAwsGithubDeployRole('a/b/c')).toThrow('owner/name');
  });
});
