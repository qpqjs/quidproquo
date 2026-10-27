import {
  buildTestQpqConfig,
  buildTestStorySession,
  defineUserDirectory,
  noopDynamicModuleLoader,
  resolveActionResult,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getUserDirectorySetAccessTokenActionProcessor } from './getUserDirectorySetAccessTokenActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { getDevUserByUserId: vi.fn(), upsertDevUser: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;
const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const base64UrlEncode = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');
const buildJwt = (payload: object): string => `${base64UrlEncode({ alg: 'none' })}.${base64UrlEncode(payload)}.dev-signature`;

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

    const result = await invokeProcessor(process, { userDirectoryName: 'directory', accessToken }, buildTestStorySession({}));

    expect(resolveActionResult(result).userId).toBe('user-1');
    expect(userStore.upsertDevUser).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'joe@example.com');
  });

  it('leaves a known user alone', async () => {
    userStore.getDevUserByUserId.mockResolvedValue({ userId: 'user-1', email: 'joe@example.com' });
    const process = await getProcessor();
    const accessToken = buildJwt({ sub: 'user-1', email: 'joe@example.com', exp: Math.floor(Date.now() / 1000) + 3600 });

    await invokeProcessor(process, { userDirectoryName: 'directory', accessToken }, buildTestStorySession({}));

    expect(userStore.upsertDevUser).not.toHaveBeenCalled();
  });
});
