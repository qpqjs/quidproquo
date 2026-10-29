import { UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getUserDirectoryConfirmEmailVerificationActionProcessor } from './getUserDirectoryConfirmEmailVerificationActionProcessor';

const getProcessor = async () => {
  const processors = await getUserDirectoryConfirmEmailVerificationActionProcessor(buildTestQpqConfig([]), noopDynamicModuleLoader);
  return processors[UserDirectoryActionType.ConfirmEmailVerification];
};

describe('getUserDirectoryConfirmEmailVerificationActionProcessor', () => {
  it('accepts any verification code in dev', async () => {
    const process = await getProcessor();

    const [result, error] = await invokeProcessor(process, { userDirectoryName: 'directory', accessToken: 'token', code: '000000' } as any);

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
  });
});
