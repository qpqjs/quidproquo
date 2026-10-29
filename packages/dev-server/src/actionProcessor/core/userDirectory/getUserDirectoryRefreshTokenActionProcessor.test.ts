import { defineUserDirectory, ErrorTypeEnum, resolveActionResult, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { createDevJwt } from '../../../logic/auth/devAuth';
import { signDevJwt } from '../../../logic/auth/devJwt';
import { getUserDirectoryRefreshTokenActionProcessor } from './getUserDirectoryRefreshTokenActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { getDevUserByUserId: vi.fn(), upsertDevUser: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);
vi.mock('../../../logic/auth/devJwtSecret', () => ({ getOrSeedDevJwtSecret: vi.fn(async () => 'test-secret') }));

const devServerConfig = buildTestDevServerConfig();
const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const buildJwtWithPayload = (payload: object): string => signDevJwt('test-secret', payload);

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
      refreshToken: createDevJwt('test-secret', resolvedDirectory, 'joe@example.com'),
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

  // Security regression: a refresh token the directory did not sign mints nothing.
  it('refuses a refresh token signed with another secret', async () => {
    const process = await getProcessor();

    const [, error] = await invokeProcessor(process, {
      userDirectoryName: 'directory',
      refreshToken: createDevJwt('another-secret', resolvedDirectory, 'joe@example.com'),
    });

    expect(error?.errorType).toBe(ErrorTypeEnum.Unauthorized);
    expect(userStore.upsertDevUser).not.toHaveBeenCalled();
  });
});
