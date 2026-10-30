import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectoryRevokeRefreshToken, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { revokeRefreshToken } from '../../../logic/cognito/revokeRefreshToken';
import { getUserDirectoryRevokeRefreshTokenActionProcessor } from './getUserDirectoryRevokeRefreshTokenActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/revokeRefreshToken', () => ({ revokeRefreshToken: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectoryRevokeRefreshTokenActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.RevokeRefreshToken];
};

describe('getUserDirectoryRevokeRefreshTokenActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(revokeRefreshToken).mockReset();
  });

  it('answers the cognito result', async () => {
    const processor = await resolveProcessor();
    vi.mocked(revokeRefreshToken).mockResolvedValue(undefined);

    const [result, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', refreshToken: 'refresh' });

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
    expect(revokeRefreshToken).toHaveBeenCalledWith('POOL', 'POOL', 'eu-west-1', 'refresh');
  });

  it('maps NotAuthorizedException to Unauthorized', async () => {
    const processor = await resolveProcessor();
    vi.mocked(revokeRefreshToken).mockRejectedValue(cognitoError('NotAuthorizedException'));

    const [, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', refreshToken: 'refresh' });

    expect(error?.errorType).toBe(askUserDirectoryRevokeRefreshToken.errorType.Unauthorized);
  });

  it('maps TooManyRequestsException to LimitExceeded', async () => {
    const processor = await resolveProcessor();
    vi.mocked(revokeRefreshToken).mockRejectedValue(cognitoError('TooManyRequestsException'));

    const [, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', refreshToken: 'refresh' });

    expect(error?.errorType).toBe(askUserDirectoryRevokeRefreshToken.errorType.LimitExceeded);
  });
});
