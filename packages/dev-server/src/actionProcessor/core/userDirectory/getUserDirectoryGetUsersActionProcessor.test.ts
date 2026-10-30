import { defineUserDirectory, resolveActionResult, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getUserDirectoryGetUsersActionProcessor } from './getUserDirectoryGetUsersActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { upsertDevUser: vi.fn(), listDevUsers: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);
vi.mock('../../../logic/auth/devJwtSecret', () => ({ getOrSeedDevJwtSecret: vi.fn(async () => 'test-secret') }));

const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const getProcessor = async () => {
  const processors = await getUserDirectoryGetUsersActionProcessor(buildTestDevServerConfig())(
    buildTestQpqConfig([defineUserDirectory('directory')]),
    noopDynamicModuleLoader,
  );
  return processors[UserDirectoryActionType.GetUsers];
};

describe('getUserDirectoryGetUsersActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists the directory's stored users", async () => {
    userStore.listDevUsers.mockResolvedValue([{ userId: 'user-1', email: 'joe@example.com' }]);
    const process = await getProcessor();

    const [result, error] = await invokeProcessor(process!, { userDirectoryName: 'directory', nextPageKey: undefined });

    expect(error).toBeUndefined();
    expect(result).toEqual({ items: [{ userId: 'user-1', email: 'joe@example.com' }] });
    expect(userStore.listDevUsers).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory);
  });
});
