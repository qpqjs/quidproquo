import { UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getUserDirectoryChangePasswordActionProcessor } from './getUserDirectoryChangePasswordActionProcessor';

const getProcessor = async () => {
  const processors = await getUserDirectoryChangePasswordActionProcessor(buildTestQpqConfig([]), noopDynamicModuleLoader);
  return processors[UserDirectoryActionType.ChangePassword];
};

describe('getUserDirectoryChangePasswordActionProcessor', () => {
  it('accepts any change, since dev stores no passwords', async () => {
    const process = await getProcessor();

    const [result, error] = await invokeProcessor(process, {
      userDirectoryName: 'directory',
      accessToken: 'token',
      previousPassword: 'old',
      proposedPassword: 'new',
    } as any);

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
  });
});
