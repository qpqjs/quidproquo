import { getEventAutoRespondNoopActionProcessor as getEventAutoRespondActionProcessor } from '@qpqjs/actionprocessor-js';
import { getEventGetStorySessionNoopActionProcessor as getEventGetStorySessionActionProcessor } from '@qpqjs/actionprocessor-js';
import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

describe('recurringSchedule getEventBridgeEventActionProcessor', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ qpqEventRecord: {}, matchResult: {} })).toEqual([null]);
  });
});
describe('recurringSchedule getEventBridgeEventActionProcessor', () => {
  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([undefined]);
  });
});
