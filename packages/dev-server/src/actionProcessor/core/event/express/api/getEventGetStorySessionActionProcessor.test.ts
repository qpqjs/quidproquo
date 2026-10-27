import { buildTestQpqConfig, EventActionType, noopDynamicModuleLoader } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';

describe('getEventGetStorySessionActionProcessor (express)', () => {
  it('delegates to the http api get-story-session processor map', async () => {
    const processors = await getEventGetStorySessionActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);

    expect(typeof processors[EventActionType.GetStorySession]).toBe('function');
  });
});
