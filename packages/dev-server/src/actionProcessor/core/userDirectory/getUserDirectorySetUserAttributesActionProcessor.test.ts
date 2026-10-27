import { buildTestQpqConfig, defineUserDirectory, noopDynamicModuleLoader, resolveActionResult, UserDirectoryActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getUserDirectorySetUserAttributesActionProcessor } from './getUserDirectorySetUserAttributesActionProcessor';

const { userStore } = vi.hoisted(() => ({
  userStore: { upsertDevUser: vi.fn() },
}));

vi.mock('../../../logic/auth/jsonUserStore', () => userStore);

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;
const resolvedDirectory = { serviceName: 'test-module', directoryName: 'directory' };

const getProcessor = async () => {
  const processors = await getUserDirectorySetUserAttributesActionProcessor(devServerConfig)(
    buildTestQpqConfig([defineUserDirectory('directory')]),
    noopDynamicModuleLoader,
  );
  return processors[UserDirectoryActionType.SetUserAttributes];
};

describe('getUserDirectorySetUserAttributesActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('persists the attributes into the store', async () => {
    userStore.upsertDevUser.mockResolvedValue({});
    const process = await getProcessor();

    const result = await invokeProcessor(process, {
      userDirectoryName: 'directory',
      username: 'joe@example.com',
      userAttributes: { givenName: 'Joe' },
    });

    expect(userStore.upsertDevUser).toHaveBeenCalledWith('/tmp/runtime', resolvedDirectory, 'joe@example.com', { givenName: 'Joe' });
    expect(resolveActionResult(result)).toBeUndefined();
  });
});
