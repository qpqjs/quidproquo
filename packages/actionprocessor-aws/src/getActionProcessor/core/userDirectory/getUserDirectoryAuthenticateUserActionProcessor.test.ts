import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import {
  askUserDirectoryAuthenticateUserBase,
  buildTestQpqConfig,
  createActionProcessor,
  defineUserDirectory,
  ProcessorFor,
  UserDirectoryActionType,
} from '@qpqjs/core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { authenticateUser } from '../../../logic/cognito/authenticateUser';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getUserDirectoryAuthenticateUserActionProcessor } from './getUserDirectoryAuthenticateUserActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/authenticateUser', () => ({ authenticateUser: vi.fn() }));
vi.mock('../../../logic/cognito/resolveUsernameByPreferredUsername', () => ({ resolveUsernameByPreferredUsername: vi.fn() }));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectoryAuthenticateUserActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.AuthenticateUser];
};

const invoke = (processor: any) =>
  invokeProcessor(processor, { userDirectoryName: 'users', authenticateUserRequest: { email: 'a@b.com', password: 'pw', isCustom: false } });

describe('getUserDirectoryAuthenticateUserActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(authenticateUser).mockReset();
    vi.mocked(resolveUsernameByPreferredUsername).mockReset().mockResolvedValue('resolved-user');
  });

  it('authenticates with the resolved username and pool details', async () => {
    vi.mocked(authenticateUser).mockResolvedValue({ accessToken: 't' } as any);
    const processor = await resolveProcessor();

    const result = await invoke(processor);

    expect(result).toEqual([{ accessToken: 't' }]);
    expect(authenticateUser).toHaveBeenCalledWith('POOL', 'POOL', 'eu-west-1', false, 'resolved-user', 'pw');
  });

  it.each([['UserNotFoundException'], ['NotAuthorizedException']])('maps %s to a UserNotFound error', async (errorName: string) => {
    vi.mocked(resolveUsernameByPreferredUsername).mockRejectedValue(Object.assign(new Error('boom'), { name: errorName }));
    const processor = await resolveProcessor();

    const [, error] = await invoke(processor);

    expect(error?.errorType).toBe(askUserDirectoryAuthenticateUserBase.errorType.UserNotFound);
  });

  // Security regression: an unknown user and a wrong password must be indistinguishable to the caller, and the
  // provider's own message must never be echoed.
  it('answers an unknown user and a wrong password with the identical error', async () => {
    const processor = await resolveProcessor();
    const answers: string[] = [];

    for (const errorName of ['UserNotFoundException', 'NotAuthorizedException']) {
      vi.mocked(resolveUsernameByPreferredUsername).mockRejectedValue(
        Object.assign(new Error(`provider detail for ${errorName}`), { name: errorName }),
      );
      const [, error] = await invoke(processor);
      answers.push(JSON.stringify({ type: error?.errorType, text: error?.errorText }));
      expect(error?.errorText).not.toContain('provider detail');
    }

    expect(new Set(answers).size).toBe(1);
  });
});
