import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectorySignOutUser, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { globalSignOut } from '../../../logic/cognito/globalSignOut';
import { getUserDirectorySignOutUserActionProcessor } from './getUserDirectorySignOutUserActionProcessor';

vi.mock('../../../logic/cognito/globalSignOut', () => ({ globalSignOut: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectorySignOutUserActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.SignOutUser];
};

describe('getUserDirectorySignOutUserActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(globalSignOut).mockReset();
  });

  it('answers the cognito result', async () => {
    const processor = await resolveProcessor();
    vi.mocked(globalSignOut).mockResolvedValue(undefined);

    const [result, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', accessToken: 'token' });

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
    expect(globalSignOut).toHaveBeenCalledWith('token', 'eu-west-1');
  });

  it('maps NotAuthorizedException to Unauthorized', async () => {
    const processor = await resolveProcessor();
    vi.mocked(globalSignOut).mockRejectedValue(cognitoError('NotAuthorizedException'));

    const [, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', accessToken: 'token' });

    expect(error?.errorType).toBe(askUserDirectorySignOutUser.errorType.Unauthorized);
  });

  it('maps TooManyRequestsException to LimitExceeded', async () => {
    const processor = await resolveProcessor();
    vi.mocked(globalSignOut).mockRejectedValue(cognitoError('TooManyRequestsException'));

    const [, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', accessToken: 'token' });

    expect(error?.errorType).toBe(askUserDirectorySignOutUser.errorType.LimitExceeded);
  });
});
