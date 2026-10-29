import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

const buildS3Record = (eventName: string, key: string): any => ({ eventName, s3: { object: { key } } });

describe('s3/fileEvent getEventMatchStoryActionProcessor', () => {
  it('returns the storage drive runtime from the environment default', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [match] = await processor({ qpqEventRecord: {} });

    expect((match as any).runtime).toBe('/::');
  });
});
