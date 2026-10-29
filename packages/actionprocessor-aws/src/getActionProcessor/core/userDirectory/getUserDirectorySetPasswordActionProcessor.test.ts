import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectorySetPassword, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';
import { setUserPassword } from '../../../logic/cognito/setUserPassword';
import { getUserDirectorySetPasswordActionProcessor } from './getUserDirectorySetPasswordActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/resolveUsernameByPreferredUsername', () => ({ resolveUsernameByPreferredUsername: vi.fn() }));
vi.mock('../../../logic/cognito/setUserPassword', () => ({ setUserPassword: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectorySetPasswordActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.SetPassword];
};

describe('getUserDirectorySetPasswordActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(resolveUsernameByPreferredUsername)
      .mockReset()
      .mockImplementation(async (_pool, _region, username) => username);
    vi.mocked(setUserPassword).mockReset();
  });

  it('answers the cognito result', async () => {
    const processor = await resolveProcessor();
    vi.mocked(setUserPassword).mockResolvedValue(undefined);

    const [result, error] = await invokeProcessor(processor, { userDirectoryName: 'users', username: 'joe@example.com', newPassword: 'N3w-pass' });

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
    expect(setUserPassword).toHaveBeenCalledWith('eu-west-1', 'POOL', 'joe@example.com', 'N3w-pass');
  });

  it('maps UserNotFoundException to UserNotFound', async () => {
    const processor = await resolveProcessor();
    vi.mocked(setUserPassword).mockRejectedValue(cognitoError('UserNotFoundException'));

    const [, error] = await invokeProcessor(processor, { userDirectoryName: 'users', username: 'joe@example.com', newPassword: 'N3w-pass' });

    expect(error?.errorType).toBe(askUserDirectorySetPassword.errorType.UserNotFound);
  });

  it('maps InvalidPasswordException to InvalidNewPassword', async () => {
    const processor = await resolveProcessor();
    vi.mocked(setUserPassword).mockRejectedValue(cognitoError('InvalidPasswordException'));

    const [, error] = await invokeProcessor(processor, { userDirectoryName: 'users', username: 'joe@example.com', newPassword: 'N3w-pass' });

    expect(error?.errorType).toBe(askUserDirectorySetPassword.errorType.InvalidNewPassword);
  });

  it('maps LimitExceededException to LimitExceeded', async () => {
    const processor = await resolveProcessor();
    vi.mocked(setUserPassword).mockRejectedValue(cognitoError('LimitExceededException'));

    const [, error] = await invokeProcessor(processor, { userDirectoryName: 'users', username: 'joe@example.com', newPassword: 'N3w-pass' });

    expect(error?.errorType).toBe(askUserDirectorySetPassword.errorType.LimitExceeded);
  });

  it('maps TooManyRequestsException to LimitExceeded', async () => {
    const processor = await resolveProcessor();
    vi.mocked(setUserPassword).mockRejectedValue(cognitoError('TooManyRequestsException'));

    const [, error] = await invokeProcessor(processor, { userDirectoryName: 'users', username: 'joe@example.com', newPassword: 'N3w-pass' });

    expect(error?.errorType).toBe(askUserDirectorySetPassword.errorType.LimitExceeded);
  });
});
