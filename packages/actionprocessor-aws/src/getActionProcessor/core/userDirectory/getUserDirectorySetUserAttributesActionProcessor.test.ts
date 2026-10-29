import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectorySetUserAttributes, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';
import { setUserAttributes } from '../../../logic/cognito/setUserAttributes';
import { getUserDirectorySetUserAttributesActionProcessor } from './getUserDirectorySetUserAttributesActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/resolveUsernameByPreferredUsername', () => ({ resolveUsernameByPreferredUsername: vi.fn() }));
vi.mock('../../../logic/cognito/setUserAttributes', () => ({ setUserAttributes: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectorySetUserAttributesActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.SetUserAttributes];
};

describe('getUserDirectorySetUserAttributesActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(resolveUsernameByPreferredUsername)
      .mockReset()
      .mockImplementation(async (_pool, _region, username) => username);
    vi.mocked(setUserAttributes).mockReset();
  });

  it('answers the cognito result', async () => {
    const processor = await resolveProcessor();
    vi.mocked(setUserAttributes).mockResolvedValue(undefined);

    const [result, error] = await invokeProcessor(processor, {
      userDirectoryName: 'users',
      username: 'joe@example.com',
      userAttributes: { email: 'new@example.com' } as any,
    });

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
    expect(setUserAttributes).toHaveBeenCalledWith('POOL', 'eu-west-1', 'joe@example.com', { email: 'new@example.com' });
  });

  it('maps UserNotFoundException to UserNotFound', async () => {
    const processor = await resolveProcessor();
    vi.mocked(setUserAttributes).mockRejectedValue(cognitoError('UserNotFoundException'));

    const [, error] = await invokeProcessor(processor, {
      userDirectoryName: 'users',
      username: 'joe@example.com',
      userAttributes: { email: 'new@example.com' } as any,
    });

    expect(error?.errorType).toBe(askUserDirectorySetUserAttributes.errorType.UserNotFound);
  });

  it('maps InvalidParameterException to InvalidAttributes', async () => {
    const processor = await resolveProcessor();
    vi.mocked(setUserAttributes).mockRejectedValue(cognitoError('InvalidParameterException'));

    const [, error] = await invokeProcessor(processor, {
      userDirectoryName: 'users',
      username: 'joe@example.com',
      userAttributes: { email: 'new@example.com' } as any,
    });

    expect(error?.errorType).toBe(askUserDirectorySetUserAttributes.errorType.InvalidAttributes);
  });

  it('maps AliasExistsException to AliasExists', async () => {
    const processor = await resolveProcessor();
    vi.mocked(setUserAttributes).mockRejectedValue(cognitoError('AliasExistsException'));

    const [, error] = await invokeProcessor(processor, {
      userDirectoryName: 'users',
      username: 'joe@example.com',
      userAttributes: { email: 'new@example.com' } as any,
    });

    expect(error?.errorType).toBe(askUserDirectorySetUserAttributes.errorType.AliasExists);
  });

  it('maps LimitExceededException to LimitExceeded', async () => {
    const processor = await resolveProcessor();
    vi.mocked(setUserAttributes).mockRejectedValue(cognitoError('LimitExceededException'));

    const [, error] = await invokeProcessor(processor, {
      userDirectoryName: 'users',
      username: 'joe@example.com',
      userAttributes: { email: 'new@example.com' } as any,
    });

    expect(error?.errorType).toBe(askUserDirectorySetUserAttributes.errorType.LimitExceeded);
  });
});
