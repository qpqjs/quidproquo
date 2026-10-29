import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectoryDecodeAccessToken, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { decodeValidJwt } from '../../../logic/cognito/decodeValidJwt';
import { getUserDirectoryDecodeAccessTokenActionProcessor } from './getUserDirectoryDecodeAccessTokenActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/decodeValidJwt', () => ({ decodeValidJwt: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectoryDecodeAccessTokenActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.DecodeAccessToken];
};

describe('getUserDirectoryDecodeAccessTokenActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(decodeValidJwt).mockReset();
  });

  it('answers the cognito result', async () => {
    const processor = await resolveProcessor();
    vi.mocked(decodeValidJwt).mockResolvedValue({ userId: 'user-1', username: 'joe@example.com', exp: 1, wasValid: true } as any);

    const [result, error] = await invokeProcessor(processor, { userDirectoryName: 'users', accessToken: 'token', ignoreExpiration: false });

    expect(error).toBeUndefined();
    expect(result).toEqual({ userId: 'user-1', username: 'joe@example.com', exp: 1, wasValid: true, userDirectory: 'users' });
    expect(decodeValidJwt).toHaveBeenCalledWith('POOL', 'eu-west-1', false, 'token');
  });

  it('answers Unauthorized when the token does not decode to a user', async () => {
    const processor = await resolveProcessor();
    vi.mocked(decodeValidJwt).mockResolvedValue(null as any);

    const [, error] = await invokeProcessor(processor, { userDirectoryName: 'users', accessToken: 'bad', ignoreExpiration: false });

    expect(error?.errorType).toBe(askUserDirectoryDecodeAccessToken.errorType.Unauthorized);
  });
});
