import { buildTestQpqConfig, buildTestStorySession, EventActionType, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';

describe('getEventGetStorySessionActionProcessor (websocket)', () => {
  it('returns an undefined story session', async () => {
    const processors = await getEventGetStorySessionActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const process = processors[EventActionType.GetStorySession];

    const result = await process(
      { qpqEventRecord: {}, eventParams: [] } as any,
      buildTestStorySession(),
      {},
      undefined as any,
      () => {},
      async () => null,
      undefined as any,
    );

    expect(resolveActionResult(result)).toBeUndefined();
  });
});
