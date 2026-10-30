import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

describe('eventBridgeEvent/recurringSchedule getEventMatchStoryActionProcessor', () => {
  it('returns the runtime from the lambda runtime config with empty options', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor({ runtime: '/entry/schedule::run' }), EventActionType.MatchStory);

    const [match] = await processor({ qpqEventRecord: {} });

    expect(match).toEqual({ runtime: '/entry/schedule::run', runtimeOptions: {} });
  });
});
