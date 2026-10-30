import { EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

const settings = {
  keyValueStoreName: 'test-events',
  runtime: '/entry/kvs::onStream' as QpqFunctionRuntime,
  coalesceByPartitionKey: true,
  partitionKey: 'pk',
};

describe('dynamo/streamEvent getEventMatchStoryActionProcessor', () => {
  it('always matches the one stream handler stamped on the lambda', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor(settings.runtime), EventActionType.MatchStory);

    const [match, error] = await processor({ qpqEventRecord: { eventType: 'INSERT' } });

    expect(error).toBeUndefined();
    expect(match).toEqual({ runtime: '/entry/kvs::onStream' as QpqFunctionRuntime });
  });
});
