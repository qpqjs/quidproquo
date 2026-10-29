import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getSqsQueueEventProcessor } from './getSqsQueueEventProcessor';

describe('sqs/queue getSqsQueueEventProcessor', () => {
  it('composes a processor for every event action', async () => {
    const processors = await getSqsQueueEventProcessor('jobs')(buildTestQpqConfig(), null as any);

    expect(Object.keys(processors).sort()).toEqual(
      [
        EventActionType.AutoRespond,
        EventActionType.GetRecords,
        EventActionType.GetStorySession,
        EventActionType.MatchStory,
        EventActionType.TransformResponseResult,
      ].sort(),
    );
  });
});
