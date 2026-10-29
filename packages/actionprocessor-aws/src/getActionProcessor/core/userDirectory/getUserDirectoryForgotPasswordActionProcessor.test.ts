import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectoryForgotPassword, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { forgotPassword } from '../../../logic/cognito/forgotPassword';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';
import { getUserDirectoryForgotPasswordActionProcessor } from './getUserDirectoryForgotPasswordActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/forgotPassword', () => ({ forgotPassword: vi.fn() }));
vi.mock('../../../logic/cognito/resolveUsernameByPreferredUsername', () => ({ resolveUsernameByPreferredUsername: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectoryForgotPasswordActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.ForgotPassword];
};

describe('getUserDirectoryForgotPasswordActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(resolveUsernameByPreferredUsername)
      .mockReset()
      .mockImplementation(async (_pool, _region, username) => username);
    vi.mocked(forgotPassword).mockReset();
  });

  it('returns the delivery details for a known user', async () => {
    const processor = await resolveProcessor();
    vi.mocked(forgotPassword).mockResolvedValue({ attributeName: 'email', deliveryMedium: 'EMAIL', destination: 'j***@e***' });

    const [result, error] = await invokeProcessor(processor, { userDirectoryName: 'users', username: 'joe@example.com' });

    expect(error).toBeUndefined();
    expect(result).toEqual({ attributeName: 'email', deliveryMedium: 'EMAIL', destination: 'j***@e***' });
  });

  // Security regression: an unknown account must look exactly like a known one, so the caller cannot tell which
  // emails have accounts. Cognito simulates a delivery when existence errors are prevented; the processor does the
  // same if the exception still arrives.
  it('answers an unknown user with a simulated delivery, never UserNotFound', async () => {
    const processor = await resolveProcessor();
    vi.mocked(forgotPassword).mockRejectedValue(cognitoError('UserNotFoundException'));

    const [result, error] = await invokeProcessor(processor, { userDirectoryName: 'users', username: 'nobody@example.com' });

    expect(error).toBeUndefined();
    expect(result).toEqual({ attributeName: 'email', deliveryMedium: 'EMAIL', destination: 'n***@e***' });
  });

  it('still reports a throttle as LimitExceeded', async () => {
    const processor = await resolveProcessor();
    vi.mocked(forgotPassword).mockRejectedValue(cognitoError('LimitExceededException'));

    const [, error] = await invokeProcessor(processor, { userDirectoryName: 'users', username: 'joe@example.com' });

    expect(error?.errorType).toBe(askUserDirectoryForgotPassword.errorType.LimitExceeded);
  });
});
