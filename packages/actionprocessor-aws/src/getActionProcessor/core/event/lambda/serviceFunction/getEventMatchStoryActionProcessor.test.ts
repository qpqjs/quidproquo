import { ErrorTypeEnum, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { defineServiceFunction } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

describe('lambda/serviceFunction getEventMatchStoryActionProcessor', () => {
  it('returns a NotFound error when no service function matches', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [, error] = await processor({ qpqEventRecord: { functionName: 'missing' } });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns the runtime for a matching service function', async () => {
    const runtime: QpqFunctionRuntime = '/entry/functions::doThing';
    const config = buildTestQpqConfig([defineServiceFunction(runtime)]);
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, config);

    const [match] = await processor({ qpqEventRecord: { functionName: 'doThing' } });

    expect((match as any).runtime).toEqual(runtime);
  });
});
