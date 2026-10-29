import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

// The processors read their configuration from the environment at module load, so this has to
// be in place before the import below is evaluated.
vi.hoisted(() => {
  process.env.keyValueStoreName = 'test-events';
  process.env.kvsStreamPartitionKey = 'pk';
  process.env.kvsStreamCoalesceByPartitionKey = 'true';
});

import { getDynamoKvsStreamEventProcessor } from './getDynamoKvsStreamEventProcessor';

describe('dynamo/streamEvent getDynamoKvsStreamEventProcessor', () => {
  it('composes a processor for every event action', async () => {
    const processors = await getDynamoKvsStreamEventProcessor(buildTestQpqConfig(), null as any);

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
