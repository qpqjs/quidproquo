import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

// Locally one process serves every handler, so the runtime travels with the message.
describe('kvsStream getEventMatchStoryActionProcessor', () => {
  it('matches the runtime carried by the message', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [match, error] = await processor({ eventParams: [{ record: {}, runtime: '/entry/x::y', storySession: {} }], qpqEventRecord: {} });

    expect(error).toBeUndefined();
    expect(match).toEqual({ runtime: '/entry/x::y' });
  });
});
