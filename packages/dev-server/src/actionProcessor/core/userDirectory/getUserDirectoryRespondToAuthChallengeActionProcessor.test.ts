import { defineUserDirectory, resolveActionResult, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getUserDirectoryRespondToAuthChallengeActionProcessor } from './getUserDirectoryRespondToAuthChallengeActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { upsertDevUser: vi.fn(), listDevUsers: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);
vi.mock('../../../logic/auth/devJwtSecret', () => ({ getOrSeedDevJwtSecret: vi.fn(async () => 'test-secret') }));

const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const getProcessor = async () => {
  const processors = await getUserDirectoryRespondToAuthChallengeActionProcessor(buildTestDevServerConfig())(
    buildTestQpqConfig([defineUserDirectory('directory')]),
    noopDynamicModuleLoader,
  );
  return processors[UserDirectoryActionType.RespondToAuthChallenge];
};

describe('getUserDirectoryRespondToAuthChallengeActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes any challenge answer, recording the user and signing them in', async () => {
    userStore.upsertDevUser.mockResolvedValue({});
    const process = await getProcessor();

    const result = await invokeProcessor(process, {
      userDirectoryName: 'directory',
      authChallenge: { challenge: 'NEW_PASSWORD_REQUIRED', username: 'joe@example.com', session: 'sess', newPassword: 'N3w-pass' } as any,
    });

    expect(userStore.upsertDevUser).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'joe@example.com');
    expect(resolveActionResult(result).authenticationInfo?.accessToken).toBeTruthy();
  });
});
