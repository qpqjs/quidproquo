import { buildTestQpqConfig, noopDynamicModuleLoader, PlatformActionType, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getPlatformGetNameActionProcessor } from './getPlatformGetNameActionProcessor';

describe('getPlatformGetNameActionProcessor', () => {
  it('answers with the name the runtime registered', async () => {
    const processors = await getPlatformGetNameActionProcessor('unit-test')(buildTestQpqConfig(), noopDynamicModuleLoader);
    const process = processors[PlatformActionType.GetName] as (payload: unknown) => Promise<any>;

    expect(resolveActionResult(await process({}))).toBe('unit-test');
  });
});
