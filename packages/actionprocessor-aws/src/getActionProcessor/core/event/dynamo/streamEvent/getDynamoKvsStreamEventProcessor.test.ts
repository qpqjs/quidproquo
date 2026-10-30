import { EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getDynamoKvsStreamEventProcessor } from './getDynamoKvsStreamEventProcessor';

const settings = {
  keyValueStoreName: 'test-events',
  runtime: '/entry/kvs::onStream' as QpqFunctionRuntime,
  coalesceByPartitionKey: true,
  partitionKey: 'pk',
};

describe('dynamo/streamEvent getDynamoKvsStreamEventProcessor', () => {
  it('composes a processor for every event action', async () => {
    const processors = await getDynamoKvsStreamEventProcessor(settings)(buildTestQpqConfig(), null as any);

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
