import { defineUserDirectory, ErrorTypeEnum, resolveActionResult, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getUserDirectoryConfirmForgotPasswordActionProcessor } from './getUserDirectoryConfirmForgotPasswordActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { upsertDevUser: vi.fn(), listDevUsers: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);
vi.mock('../../../logic/auth/devJwtSecret', () => ({ getOrSeedDevJwtSecret: vi.fn(async () => 'test-secret') }));

const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const getProcessor = async () => {
  const processors = await getUserDirectoryConfirmForgotPasswordActionProcessor(buildTestDevServerConfig())(
    buildTestQpqConfig([defineUserDirectory('directory')]),
    noopDynamicModuleLoader,
  );
  return processors[UserDirectoryActionType.ConfirmForgotPassword];
};

describe('getUserDirectoryConfirmForgotPasswordActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts any code, records the user and signs them in', async () => {
    userStore.upsertDevUser.mockResolvedValue({});
    const process = await getProcessor();

    const result = await invokeProcessor(process!, {
      userDirectoryName: 'directory',
      code: '000000',
      username: 'joe@example.com',
      password: 'N3w-pass',
    });

    expect(userStore.upsertDevUser).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'joe@example.com');
    expect(resolveActionResult(result).authenticationInfo?.accessToken).toBeTruthy();
  });

  it('answers a generic error when the store cannot be written', async () => {
    userStore.upsertDevUser.mockRejectedValue(new Error('disk full'));
    const process = await getProcessor();

    const [, error] = await invokeProcessor(process!, {
      userDirectoryName: 'directory',
      code: '000000',
      username: 'joe@example.com',
      password: 'N3w-pass',
    });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
