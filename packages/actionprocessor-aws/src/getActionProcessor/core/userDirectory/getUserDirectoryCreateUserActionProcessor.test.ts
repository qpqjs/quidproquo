import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import {
  askUserDirectoryCreateUser,
  buildTestQpqConfig,
  createActionProcessor,
  defineUserDirectory,
  ProcessorFor,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { createUser } from '../../../logic/cognito/createUser';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getUserDirectoryCreateUserActionProcessor } from './getUserDirectoryCreateUserActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/createUser', () => ({ createUser: vi.fn() }));
vi.mock('../../../logic/cognito/resolveUsernameByPreferredUsername', () => ({ resolveUsernameByPreferredUsername: vi.fn() }));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectoryCreateUserActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.CreateUser];
};

const invoke = (processor: any) => invokeProcessor(processor, { userDirectoryName: 'users', createUserRequest: { email: 'a@b.com' } });

describe('getUserDirectoryCreateUserActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(createUser).mockReset();
    vi.mocked(resolveUsernameByPreferredUsername).mockReset();
  });

  it('creates the user when the email is not already taken', async () => {
    vi.mocked(resolveUsernameByPreferredUsername).mockResolvedValue('a@b.com');
    vi.mocked(createUser).mockResolvedValue({ accessToken: 't' } as any);
    const processor = await resolveProcessor();

    const result = await invoke(processor);

    expect(result).toEqual([{ accessToken: 't' }]);
    expect(createUser).toHaveBeenCalledWith('POOL', 'eu-west-1', 'POOL', { email: 'a@b.com' });
  });

  it('returns a Conflict error when the email resolves to an existing user', async () => {
    vi.mocked(resolveUsernameByPreferredUsername).mockResolvedValue('existing-user');
    const processor = await resolveProcessor();

    const [, error] = await invoke(processor);

    expect(error?.errorType).toBe(askUserDirectoryCreateUser.errorType.Conflict);
    expect(createUser).not.toHaveBeenCalled();
  });
});
