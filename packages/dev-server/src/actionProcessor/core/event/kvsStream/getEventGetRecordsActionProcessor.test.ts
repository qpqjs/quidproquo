import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

// The local backend already builds the record in its final shape, so this is a passthrough.
describe('kvsStream getEventGetRecordsActionProcessor', () => {
  it("hands the message's record through as the one event record", async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const record = { id: 'r1' };

    const [records, error] = await processor({ eventParams: [{ record, runtime: '/entry/x::y', storySession: {} }] });

    expect(error).toBeUndefined();
    expect(records).toEqual([record]);
  });
});
