import { getEventGetStorySessionNoopActionProcessor as getEventGetStorySessionActionProcessor } from '@qpqjs/actionprocessor-js';
import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

const config = buildTestQpqConfig();

const buildEvent = (stackName: string, status: string): any => ({
  detail: { 'status-details': { status }, 'stack-id': `arn:aws:cloudformation:us-east-1:1:stack/${stackName}/abc` },
});

describe('deployStack getEventBridgeStackDeployEventActionProcessor', () => {
  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession, config);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([undefined]);
  });
});
