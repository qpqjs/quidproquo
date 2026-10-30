import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectoryConfirmForgotPassword, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { confirmForgotPassword } from '../../../logic/cognito/confirmForgotPassword';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';
import { getUserDirectoryConfirmForgotPasswordActionProcessor } from './getUserDirectoryConfirmForgotPasswordActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/confirmForgotPassword', () => ({ confirmForgotPassword: vi.fn() }));
vi.mock('../../../logic/cognito/resolveUsernameByPreferredUsername', () => ({ resolveUsernameByPreferredUsername: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectoryConfirmForgotPasswordActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.ConfirmForgotPassword];
};

describe('getUserDirectoryConfirmForgotPasswordActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(resolveUsernameByPreferredUsername)
      .mockReset()
      .mockImplementation(async (_pool: any, _region: any, username: any) => username);
    vi.mocked(confirmForgotPassword).mockReset();
  });

  it('answers the cognito result', async () => {
    const processor = await resolveProcessor();
    vi.mocked(confirmForgotPassword).mockResolvedValue({ challenge: 'NONE' } as any);

    const [result, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      code: '123456',
      username: 'joe@example.com',
      password: 'N3w-pass',
    });

    expect(error).toBeUndefined();
    expect(result).toEqual({ challenge: 'NONE' });
    expect(confirmForgotPassword).toHaveBeenCalledWith('POOL', 'POOL', 'eu-west-1', '123456', 'joe@example.com', 'N3w-pass');
  });

  it('maps CodeMismatchException to InvalidCode', async () => {
    const processor = await resolveProcessor();
    vi.mocked(confirmForgotPassword).mockRejectedValue(cognitoError('CodeMismatchException'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      code: '123456',
      username: 'joe@example.com',
      password: 'N3w-pass',
    });

    expect(error?.errorType).toBe(askUserDirectoryConfirmForgotPassword.errorType.InvalidCode);
  });

  it('maps ExpiredCodeException to ExpiredCode', async () => {
    const processor = await resolveProcessor();
    vi.mocked(confirmForgotPassword).mockRejectedValue(cognitoError('ExpiredCodeException'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      code: '123456',
      username: 'joe@example.com',
      password: 'N3w-pass',
    });

    expect(error?.errorType).toBe(askUserDirectoryConfirmForgotPassword.errorType.ExpiredCode);
  });

  it('maps InvalidPasswordException to InvalidNewPassword', async () => {
    const processor = await resolveProcessor();
    vi.mocked(confirmForgotPassword).mockRejectedValue(cognitoError('InvalidPasswordException'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      code: '123456',
      username: 'joe@example.com',
      password: 'N3w-pass',
    });

    expect(error?.errorType).toBe(askUserDirectoryConfirmForgotPassword.errorType.InvalidNewPassword);
  });

  it('maps LimitExceededException to LimitExceeded', async () => {
    const processor = await resolveProcessor();
    vi.mocked(confirmForgotPassword).mockRejectedValue(cognitoError('LimitExceededException'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      code: '123456',
      username: 'joe@example.com',
      password: 'N3w-pass',
    });

    expect(error?.errorType).toBe(askUserDirectoryConfirmForgotPassword.errorType.LimitExceeded);
  });
});
