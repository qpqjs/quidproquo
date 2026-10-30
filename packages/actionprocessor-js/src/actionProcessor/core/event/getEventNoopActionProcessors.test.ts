import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventAutoRespondNoopActionProcessor } from './getEventAutoRespondNoopActionProcessor';
import { getEventGetStorySessionNoopActionProcessor } from './getEventGetStorySessionNoopActionProcessor';

describe('the shared no-op event processors', () => {
  it('auto responds with null', async () => {
    const processors = await getEventAutoRespondNoopActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);

    expect(await invokeProcessor(processors[EventActionType.AutoRespond]!, { qpqEventRecord: {}, matchResult: {} })).toEqual([null]);
  });

  it('returns no story session', async () => {
    const processors = await getEventGetStorySessionNoopActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);

    expect(await invokeProcessor(processors[EventActionType.GetStorySession]!, { qpqEventRecord: {}, eventParams: [] })).toEqual([null]);
  });
});
