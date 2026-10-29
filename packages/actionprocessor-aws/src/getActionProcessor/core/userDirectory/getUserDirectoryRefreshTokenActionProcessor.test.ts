import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectoryRefreshToken, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { refreshToken } from '../../../logic/cognito/refreshToken';
import { getUserDirectoryRefreshTokenActionProcessor } from './getUserDirectoryRefreshTokenActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/refreshToken', () => ({ refreshToken: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectoryRefreshTokenActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.RefreshToken];
};

describe('getUserDirectoryRefreshTokenActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(refreshToken).mockReset();
  });

  it('answers the cognito result', async () => {
    const processor = await resolveProcessor();
    vi.mocked(refreshToken).mockResolvedValue({ challenge: 'NONE' } as any);

    const [result, error] = await invokeProcessor(
      processor!,
      { userDirectoryName: 'users', refreshToken: 'refresh' },
      { session: { decodedAccessToken: { userId: 'user-1', username: 'joe@example.com', exp: 1, wasValid: false, userDirectory: 'users' } } },
    );

    expect(error).toBeUndefined();
    expect(result).toEqual({ challenge: 'NONE' });
    expect(refreshToken).toHaveBeenCalledWith('POOL', 'POOL', 'eu-west-1', 'joe@example.com', 'refresh');
  });

  it('maps NotAuthorizedException to Unauthorized', async () => {
    const processor = await resolveProcessor();
    vi.mocked(refreshToken).mockRejectedValue(cognitoError('NotAuthorizedException'));

    const [, error] = await invokeProcessor(
      processor!,
      { userDirectoryName: 'users', refreshToken: 'refresh' },
      { session: { decodedAccessToken: { userId: 'user-1', username: 'joe@example.com', exp: 1, wasValid: false, userDirectory: 'users' } } },
    );

    expect(error?.errorType).toBe(askUserDirectoryRefreshToken.errorType.Unauthorized);
  });

  it('maps TooManyRequestsException to LimitExceeded', async () => {
    const processor = await resolveProcessor();
    vi.mocked(refreshToken).mockRejectedValue(cognitoError('TooManyRequestsException'));

    const [, error] = await invokeProcessor(
      processor!,
      { userDirectoryName: 'users', refreshToken: 'refresh' },
      { session: { decodedAccessToken: { userId: 'user-1', username: 'joe@example.com', exp: 1, wasValid: false, userDirectory: 'users' } } },
    );

    expect(error?.errorType).toBe(askUserDirectoryRefreshToken.errorType.LimitExceeded);
  });

  // Security regression: the refresh is bound to the session's username; with no decoded token there is nobody to
  // refresh for, and the refresh token is never sent to Cognito.
  it('answers Unauthorized when the session carries no decoded access token', async () => {
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', refreshToken: 'refresh' }, { session: {} });

    expect(error?.errorType).toBe(askUserDirectoryRefreshToken.errorType.Unauthorized);
    expect(refreshToken).not.toHaveBeenCalled();
  });
});
