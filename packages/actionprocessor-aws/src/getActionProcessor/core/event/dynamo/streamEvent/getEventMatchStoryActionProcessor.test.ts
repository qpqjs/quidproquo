import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

// The runtime is stamped on the lambda environment at module load, so it has to be in place
// before the import below is evaluated.
vi.hoisted(() => {
  process.env.kvsStreamEntry = JSON.stringify('/entry/kvs::onStream');
});

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

describe('dynamo/streamEvent getEventMatchStoryActionProcessor', () => {
  it('always matches the one stream handler stamped on the lambda', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [match, error] = await processor({ qpqEventRecord: { eventType: 'INSERT' } });

    expect(error).toBeUndefined();
    expect(match).toEqual({ runtime: '/entry/kvs::onStream' });
  });
});
