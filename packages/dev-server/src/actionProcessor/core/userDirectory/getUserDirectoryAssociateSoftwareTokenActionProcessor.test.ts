import { UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getUserDirectoryAssociateSoftwareTokenActionProcessor } from './getUserDirectoryAssociateSoftwareTokenActionProcessor';

const getProcessor = async () => {
  const processors = await getUserDirectoryAssociateSoftwareTokenActionProcessor(buildTestQpqConfig([]), noopDynamicModuleLoader);
  return processors[UserDirectoryActionType.AssociateSoftwareToken];
};

describe('getUserDirectoryAssociateSoftwareTokenActionProcessor', () => {
  it('hands back a fixed dev secret with the same session; no code is ever verified locally', async () => {
    const process = await getProcessor();

    const [result, error] = await invokeProcessor(process, { userDirectoryName: 'directory', session: 'sess' } as any);

    expect(error).toBeUndefined();
    expect(result).toEqual({ secretCode: 'DEVDEVDEVDEVDEVD', session: 'sess' });
  });
});
