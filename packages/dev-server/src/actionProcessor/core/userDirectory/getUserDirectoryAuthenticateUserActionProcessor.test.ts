import {
  AuthenticateUserChallenge,
  buildTestQpqConfig,
  defineUserDirectory,
  noopDynamicModuleLoader,
  resolveActionResult,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getUserDirectoryAuthenticateUserActionProcessor } from './getUserDirectoryAuthenticateUserActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { upsertDevUser: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;
const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const getProcessor = async () => {
  const processors = await getUserDirectoryAuthenticateUserActionProcessor(devServerConfig)(
    buildTestQpqConfig([defineUserDirectory('directory')]),
    noopDynamicModuleLoader,
  );
  return processors[UserDirectoryActionType.AuthenticateUser];
};

describe('getUserDirectoryAuthenticateUserActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates the store entry for the login and mints tokens', async () => {
    userStore.upsertDevUser.mockResolvedValue({});
    const process = await getProcessor();

    const result = await invokeProcessor(process, {
      userDirectoryName: 'directory',
      authenticateUserRequest: { email: 'joe@example.com', password: 'anything', isCustom: false },
    });

    expect(userStore.upsertDevUser).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'joe@example.com');

    const response = resolveActionResult(result);
    expect(response.challenge).toBe(AuthenticateUserChallenge.NONE);
    expect(response.authenticationInfo?.accessToken).toBeTruthy();
  });
});
