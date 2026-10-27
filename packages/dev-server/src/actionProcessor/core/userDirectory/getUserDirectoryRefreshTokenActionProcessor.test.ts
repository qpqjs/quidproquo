import { buildTestQpqConfig, defineUserDirectory, noopDynamicModuleLoader, resolveActionResult, UserDirectoryActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createDevJwt } from '../../../logic/auth/devAuth';
import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getUserDirectoryRefreshTokenActionProcessor } from './getUserDirectoryRefreshTokenActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { getDevUserByUserId: vi.fn(), upsertDevUser: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;
const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const base64UrlEncode = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');
const buildJwtWithPayload = (payload: object): string => `${base64UrlEncode({ alg: 'none' })}.${base64UrlEncode(payload)}.dev-signature`;

const getProcessor = async () => {
  const processors = await getUserDirectoryRefreshTokenActionProcessor(devServerConfig)(
    buildTestQpqConfig([defineUserDirectory('directory')]),
    noopDynamicModuleLoader,
  );
  return processors[UserDirectoryActionType.RefreshToken];
};

describe('getUserDirectoryRefreshTokenActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps the user the refresh token was minted for', async () => {
    userStore.upsertDevUser.mockResolvedValue({});
    const process = await getProcessor();

    const result = await invokeProcessor(process, {
      userDirectoryName: 'directory',
      refreshToken: createDevJwt(resolvedDirectory, 'joe@example.com'),
    });

    expect(userStore.upsertDevUser).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'joe@example.com');
    expect(resolveActionResult(result).authenticationInfo?.accessToken).toBeTruthy();
  });

  it('resolves a sub-only token back to its email through the store', async () => {
    userStore.getDevUserByUserId.mockResolvedValue({ userId: 'user-1', email: 'joe@example.com' });
    userStore.upsertDevUser.mockResolvedValue({});
    const process = await getProcessor();

    await invokeProcessor(process, { userDirectoryName: 'directory', refreshToken: buildJwtWithPayload({ sub: 'user-1' }) });

    expect(userStore.getDevUserByUserId).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'user-1');
    expect(userStore.upsertDevUser).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'joe@example.com');
  });
});
