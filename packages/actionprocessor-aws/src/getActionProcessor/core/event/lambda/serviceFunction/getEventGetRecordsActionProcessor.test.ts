import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

describe('lambda/serviceFunction getEventGetRecordsActionProcessor', () => {
  it('maps the function name and payload to an internal record', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = { functionName: 'doThing', payload: [1, 2] };

    const [records] = await processor({ eventParams: [event, {}] });

    expect(records).toEqual([{ functionName: 'doThing', payload: [1, 2] }]);
  });
});
