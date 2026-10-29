import { UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getUserDirectorySetPasswordActionProcessor } from './getUserDirectorySetPasswordActionProcessor';

const getProcessor = async () => {
  const processors = await getUserDirectorySetPasswordActionProcessor(buildTestQpqConfig([]), noopDynamicModuleLoader);
  return processors[UserDirectoryActionType.SetPassword];
};

describe('getUserDirectorySetPasswordActionProcessor', () => {
  it('accepts any password, since dev stores none', async () => {
    const process = await getProcessor();

    const [result, error] = await invokeProcessor(process, { userDirectoryName: 'directory', username: 'joe@example.com', newPassword: 'N3w-pass' });

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
  });
});
