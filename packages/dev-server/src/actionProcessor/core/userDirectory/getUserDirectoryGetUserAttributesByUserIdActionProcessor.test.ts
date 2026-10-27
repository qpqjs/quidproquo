import {
  askUserDirectoryGetUserAttributesByUserId,
  buildTestQpqConfig,
  createActionProcessor,
  defineUserDirectory,
  isErroredActionResult,
  noopDynamicModuleLoader,
  ProcessorFor,
  resolveActionResult,
  resolveActionResultError,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getUserDirectoryGetUserAttributesByUserIdActionProcessor } from './getUserDirectoryGetUserAttributesByUserIdActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { getDevUserByUserId: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;
const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const getProcessor = async () => {
  const processors = await getUserDirectoryGetUserAttributesByUserIdActionProcessor(devServerConfig)(
    buildTestQpqConfig([defineUserDirectory('directory')]),
    noopDynamicModuleLoader,
  );
  return processors[UserDirectoryActionType.GetUserAttributesByUserId];
};

describe('getUserDirectoryGetUserAttributesByUserIdActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the user from the store', async () => {
    const user = { userId: 'user-1', email: 'joe@example.com' };
    userStore.getDevUserByUserId.mockResolvedValue(user);
    const process = await getProcessor();

    const result = await invokeProcessor(process, { userDirectoryName: 'directory', userId: 'user-1' });

    expect(userStore.getDevUserByUserId).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'user-1');
    expect(resolveActionResult(result)).toEqual(user);
  });

  it('errors with UserNotFound for an unknown userId', async () => {
    userStore.getDevUserByUserId.mockResolvedValue(null);
    const process = await getProcessor();

    const result = await invokeProcessor(process, { userDirectoryName: 'directory', userId: 'unknown' });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(askUserDirectoryGetUserAttributesByUserId.errorType.UserNotFound);
  });
});
