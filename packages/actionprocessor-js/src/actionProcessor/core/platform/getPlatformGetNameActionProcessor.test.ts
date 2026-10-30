import { PlatformActionType, resolveActionResult } from '@qpqjs/core';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getPlatformGetNameActionProcessor } from './getPlatformGetNameActionProcessor';

describe('getPlatformGetNameActionProcessor', () => {
  it('answers with the name the runtime registered', async () => {
    const processors = await getPlatformGetNameActionProcessor('unit-test')(buildTestQpqConfig(), noopDynamicModuleLoader);
    const process = processors[PlatformActionType.GetName] as (payload: unknown) => Promise<any>;

    expect(resolveActionResult(await process({}))).toBe('unit-test');
  });
});
