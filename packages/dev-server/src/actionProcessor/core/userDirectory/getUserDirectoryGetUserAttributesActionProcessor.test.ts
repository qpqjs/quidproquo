import { defineUserDirectory, resolveActionResult, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getUserDirectoryGetUserAttributesActionProcessor } from './getUserDirectoryGetUserAttributesActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { upsertDevUser: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;
const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const getProcessor = async () => {
  const processors = await getUserDirectoryGetUserAttributesActionProcessor(devServerConfig)(
    buildTestQpqConfig([defineUserDirectory('directory')]),
    noopDynamicModuleLoader,
  );
  return processors[UserDirectoryActionType.GetUserAttributes];
};

describe('getUserDirectoryGetUserAttributesActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates the store entry on first access and returns it', async () => {
    const user = { userId: 'user-1', email: 'joe@example.com' };
    userStore.upsertDevUser.mockResolvedValue(user);
    const process = await getProcessor();

    const result = await invokeProcessor(process, { userDirectoryName: 'directory', username: 'joe@example.com' });

    expect(userStore.upsertDevUser).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'joe@example.com');
    expect(resolveActionResult(result)).toEqual(user);
  });
});
