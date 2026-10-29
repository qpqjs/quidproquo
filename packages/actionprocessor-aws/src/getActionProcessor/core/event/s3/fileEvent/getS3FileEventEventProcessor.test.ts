import { getEventAutoRespondNoopActionProcessor as getEventAutoRespondActionProcessor } from '@qpqjs/actionprocessor-js';
import { EventActionType, storageScopeContext } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';

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
