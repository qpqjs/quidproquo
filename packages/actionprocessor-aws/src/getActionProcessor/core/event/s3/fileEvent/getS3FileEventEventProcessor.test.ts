import { getEventAutoRespondNoopActionProcessor as getEventAutoRespondActionProcessor } from '@qpqjs/actionprocessor-js';
import { EventActionType, QpqFunctionRuntime, storageScopeContext } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getS3FileEventEventProcessor } from './getS3FileEventEventProcessor';

const buildS3Record = (eventName: string, key: string): any => ({ eventName, s3: { object: { key } } });

describe('fileEvent getS3FileEventEventProcessor', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ qpqEventRecord: {}, matchResult: {} })).toEqual([null]);
  });
});
describe('fileEvent getS3FileEventEventProcessor', () => {
  it('runs a scoped record under its scope as the ambient storage scope', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    const [session] = await processor({ qpqEventRecord: { scope: 'TENANT#a' }, eventParams: [] });

    expect((session as any).context[storageScopeContext.uniqueName]).toBe('TENANT#a');
  });
});

describe('fileEvent getS3FileEventEventProcessor composition', () => {
  it('composes a processor for every event action for the drive the handler names', async () => {
    const processors = await getS3FileEventEventProcessor('uploads', '/entry/drive::onEvent' as QpqFunctionRuntime)(
      buildTestQpqConfig(),
      null as any,
    );

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
