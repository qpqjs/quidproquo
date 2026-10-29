import { defineUserDirectory, resolveActionResult, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getUserDirectoryCreateUserActionProcessor } from './getUserDirectoryCreateUserActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { upsertDevUser: vi.fn(), listDevUsers: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);
vi.mock('../../../logic/auth/devJwtSecret', () => ({ getOrSeedDevJwtSecret: vi.fn(async () => 'test-secret') }));

const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const getProcessor = async () => {
  const processors = await getUserDirectoryCreateUserActionProcessor(buildTestDevServerConfig())(
    buildTestQpqConfig([defineUserDirectory('directory')]),
    noopDynamicModuleLoader,
  );
  return processors[UserDirectoryActionType.CreateUser];
};

describe('getUserDirectoryCreateUserActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  // Security regression: the password never reaches the local user store.
  it('stores every attribute but the password and signs the new user in', async () => {
    userStore.upsertDevUser.mockResolvedValue({});
    const process = await getProcessor();

    const result = await invokeProcessor(process, {
      userDirectoryName: 'directory',
      createUserRequest: { email: 'joe@example.com', password: 'S3cret!', phone: '+61' } as any,
    });

    expect(userStore.upsertDevUser).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'joe@example.com', {
      email: 'joe@example.com',
      phone: '+61',
    });
    expect(resolveActionResult(result).authenticationInfo?.accessToken).toBeTruthy();
  });
});
