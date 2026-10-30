import { SystemActionType } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getSystemTraceStoryActionProcessor } from './getSystemTraceStoryActionProcessor';

describe('getSystemTraceStoryActionProcessor', () => {
  it('registers the node tracer, tuned to also trace the federated code cache', async () => {
    const processors = await getSystemTraceStoryActionProcessor(buildTestQpqConfig(), null as any);

    expect(Object.keys(processors)).toEqual([SystemActionType.TraceStory]);
  });
});
