import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectoryGetUserAttributes, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { getUserAttributes } from '../../../logic/cognito/getUserAttributes';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';
import { getUserDirectoryGetUserAttributesActionProcessor } from './getUserDirectoryGetUserAttributesActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/getUserAttributes', () => ({ getUserAttributes: vi.fn() }));
vi.mock('../../../logic/cognito/resolveUsernameByPreferredUsername', () => ({ resolveUsernameByPreferredUsername: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectoryGetUserAttributesActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.GetUserAttributes];
};

describe('getUserDirectoryGetUserAttributesActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(resolveUsernameByPreferredUsername)
      .mockReset()
      .mockImplementation(async (_pool: any, _region: any, username: any) => username);
    vi.mocked(getUserAttributes).mockReset();
  });

  it('answers the cognito result', async () => {
    const processor = await resolveProcessor();
    vi.mocked(getUserAttributes).mockResolvedValue({ email: 'joe@example.com' } as any);

    const [result, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', username: 'joe@example.com' });

    expect(error).toBeUndefined();
    expect(result).toEqual({ email: 'joe@example.com' });
    expect(getUserAttributes).toHaveBeenCalledWith('POOL', 'eu-west-1', 'joe@example.com');
  });

  it('maps UserNotFoundException to UserNotFound', async () => {
    const processor = await resolveProcessor();
    vi.mocked(getUserAttributes).mockRejectedValue(cognitoError('UserNotFoundException'));

    const [, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', username: 'joe@example.com' });

    expect(error?.errorType).toBe(askUserDirectoryGetUserAttributes.errorType.UserNotFound);
  });
});
