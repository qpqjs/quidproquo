import { buildTestQpqConfig, buildTestStorySession, EventActionType, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';

describe('getEventAutoRespondActionProcessor (websocket)', () => {
  it('returns null, never auto responding', async () => {
    const processors = await getEventAutoRespondActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const process = processors[EventActionType.AutoRespond];

    const result = await process(
      { qpqEventRecord: {}, matchResult: {} } as any,
      buildTestStorySession(),
      {},
      undefined as any,
      () => {},
      async () => null,
      undefined as any,
    );

    expect(resolveActionResult(result)).toBeNull();
  });
});
