import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectoryGetUserAttributesByUserId, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { getUserAttributesBySub } from '../../../logic/cognito/getUserAttributesBySub';
import { getUserDirectoryGetUserAttributesByUserIdActionProcessor } from './getUserDirectoryGetUserAttributesByUserIdActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/getUserAttributesBySub', () => ({ getUserAttributesBySub: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectoryGetUserAttributesByUserIdActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.GetUserAttributesByUserId];
};

describe('getUserDirectoryGetUserAttributesByUserIdActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(getUserAttributesBySub).mockReset();
  });

  it('answers the cognito result', async () => {
    const processor = await resolveProcessor();
    vi.mocked(getUserAttributesBySub).mockResolvedValue({ email: 'joe@example.com' } as any);

    const [result, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', userId: 'user-1' });

    expect(error).toBeUndefined();
    expect(result).toEqual({ email: 'joe@example.com' });
    expect(getUserAttributesBySub).toHaveBeenCalledWith('POOL', 'eu-west-1', 'user-1');
  });

  it('maps USER_NOT_FOUND to UserNotFound', async () => {
    const processor = await resolveProcessor();
    vi.mocked(getUserAttributesBySub).mockRejectedValue(cognitoError('USER_NOT_FOUND'));

    const [, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', userId: 'user-1' });

    expect(error?.errorType).toBe(askUserDirectoryGetUserAttributesByUserId.errorType.UserNotFound);
  });
});
