import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';

describe('apiGatwayEvent/api getEventGetStorySessionActionProcessor', () => {
  it('registers the GetStorySession processor it wraps', async () => {
    const processors = await getEventGetStorySessionActionProcessor(buildTestQpqConfig(), null as any);

    expect(Object.keys(processors)).toEqual([EventActionType.GetStorySession]);
  });
});
