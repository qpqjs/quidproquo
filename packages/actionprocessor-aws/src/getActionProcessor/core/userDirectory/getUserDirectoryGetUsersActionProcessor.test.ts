import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectoryGetUsers, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { listPagedUsers } from '../../../logic/cognito/listPagedUsers';
import { getUserDirectoryGetUsersActionProcessor } from './getUserDirectoryGetUsersActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/listPagedUsers', () => ({ listPagedUsers: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectoryGetUsersActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.GetUsers];
};

describe('getUserDirectoryGetUsersActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(listPagedUsers).mockReset();
  });

  it('answers the cognito result', async () => {
    const processor = await resolveProcessor();
    vi.mocked(listPagedUsers).mockResolvedValue({ items: [], nextPageKey: null } as any);

    const [result, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', nextPageKey: 'page-2' });

    expect(error).toBeUndefined();
    expect(result).toEqual({ items: [], nextPageKey: null });
    expect(listPagedUsers).toHaveBeenCalledWith('POOL', 'eu-west-1', 'page-2');
  });

  it('maps InvalidParameterException to InvalidPageKey', async () => {
    const processor = await resolveProcessor();
    vi.mocked(listPagedUsers).mockRejectedValue(cognitoError('InvalidParameterException'));

    const [, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', nextPageKey: 'page-2' });

    expect(error?.errorType).toBe(askUserDirectoryGetUsers.errorType.InvalidPageKey);
  });

  it('maps TooManyRequestsException to LimitExceeded', async () => {
    const processor = await resolveProcessor();
    vi.mocked(listPagedUsers).mockRejectedValue(cognitoError('TooManyRequestsException'));

    const [, error] = await invokeProcessor(processor!, { userDirectoryName: 'users', nextPageKey: 'page-2' });

    expect(error?.errorType).toBe(askUserDirectoryGetUsers.errorType.LimitExceeded);
  });
});
