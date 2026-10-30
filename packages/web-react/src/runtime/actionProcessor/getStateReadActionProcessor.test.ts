import { StateActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getStateReadActionListResolver } from './getStateReadActionProcessor';

describe('getStateReadActionListResolver', () => {
  it('resolves a Read processor that returns the current state', async () => {
    const processors = await getStateReadActionListResolver(() => ({ count: 3 }))(buildTestQpqConfig(), noopDynamicModuleLoader);

    const result = await invokeProcessor(processors[StateActionType.Read]!, {});

    expect(result).toEqual([{ count: 3 }]);
  });
});
