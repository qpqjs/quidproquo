import { buildTestQpqConfig, defineUserDirectory, noopDynamicModuleLoader, resolveActionResult, UserDirectoryActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getUserDirectoryGetUsersByAttributeActionProcessor } from './getUserDirectoryGetUsersByAttributeActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { findDevUsersByAttribute: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;
const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const getProcessor = async () => {
  const processors = await getUserDirectoryGetUsersByAttributeActionProcessor(devServerConfig)(
    buildTestQpqConfig([defineUserDirectory('directory')]),
    noopDynamicModuleLoader,
  );
  return processors[UserDirectoryActionType.GetUsersByAttribute];
};

describe('getUserDirectoryGetUsersByAttributeActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the matching users from the store', async () => {
    const users = [{ userId: 'user-1', email: 'joe@example.com' }];
    userStore.findDevUsersByAttribute.mockResolvedValue(users);
    const process = await getProcessor();

    const result = await invokeProcessor(process, { userDirectoryName: 'directory', attribueName: 'email', attribueValue: 'joe@example.com' });

    expect(userStore.findDevUsersByAttribute).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'email', 'joe@example.com');
    expect(resolveActionResult(result)).toEqual({ items: users });
  });

  it('applies the requested limit', async () => {
    userStore.findDevUsersByAttribute.mockResolvedValue([{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }]);
    const process = await getProcessor();

    const result = await invokeProcessor(process, {
      userDirectoryName: 'directory',
      attribueName: 'emailVerified',
      attribueValue: 'true',
      limit: 2,
    });

    expect(resolveActionResult(result).items).toHaveLength(2);
  });
});
