import { defineUserDirectory, resolveActionResult, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, buildTestStorySession, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { signDevJwt } from '../../../logic/auth/devJwt';
import { getUserDirectorySetAccessTokenActionProcessor } from './getUserDirectorySetAccessTokenActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { getDevUserByUserId: vi.fn(), upsertDevUser: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);
vi.mock('../../../logic/auth/devJwtSecret', () => ({ getOrSeedDevJwtSecret: vi.fn(async () => 'test-secret') }));

const devServerConfig = buildTestDevServerConfig();
const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const buildJwt = (payload: object): string => signDevJwt('test-secret', payload);

const getProcessor = async () => {
  const processors = await getUserDirectorySetAccessTokenActionProcessor(devServerConfig)(
    buildTestQpqConfig([defineUserDirectory('directory')]),
    noopDynamicModuleLoader,
  );
  return processors[UserDirectoryActionType.SetAccessToken];
};

describe('getUserDirectorySetAccessTokenActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('recreates a missing user from the token, so a restored session resolves after a reseed', async () => {
    userStore.getDevUserByUserId.mockResolvedValue(null);
    const process = await getProcessor();
    const accessToken = buildJwt({ sub: 'user-1', email: 'joe@example.com', exp: Math.floor(Date.now() / 1000) + 3600 });

    const result = await invokeProcessor(process!, { userDirectoryName: 'directory', accessToken }, { session: buildTestStorySession({}) });

    expect(resolveActionResult(result).userId).toBe('user-1');
    expect(userStore.upsertDevUser).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'joe@example.com');
  });

  it('leaves a known user alone', async () => {
    userStore.getDevUserByUserId.mockResolvedValue({ userId: 'user-1', email: 'joe@example.com' });
    const process = await getProcessor();
    const accessToken = buildJwt({ sub: 'user-1', email: 'joe@example.com', exp: Math.floor(Date.now() / 1000) + 3600 });

    await invokeProcessor(process!, { userDirectoryName: 'directory', accessToken }, { session: buildTestStorySession({}) });

    expect(userStore.upsertDevUser).not.toHaveBeenCalled();
  });
});
