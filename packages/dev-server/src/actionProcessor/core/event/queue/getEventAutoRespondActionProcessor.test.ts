import { buildTestQpqConfig, buildTestStorySession, EventActionType, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';

const invoke = async (matchResult: any) => {
  const processors = await getEventAutoRespondActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  const process = processors[EventActionType.AutoRespond];
  return process(
    { matchResult } as any,
    buildTestStorySession(),
    {},
    undefined as any,
    () => {},
    async () => null,
    undefined as any,
  );
};

describe('getEventAutoRespondActionProcessor (queue)', () => {
  it('auto responds true when there is no matched runtime', async () => {
    const result = await invoke({ runtime: undefined });

    expect(resolveActionResult(result)).toBe(true);
  });

  it('returns null when a runtime was matched', async () => {
    const result = await invoke({ runtime: '/entry::onOrder' });

    expect(resolveActionResult(result)).toBeNull();
  });
});
