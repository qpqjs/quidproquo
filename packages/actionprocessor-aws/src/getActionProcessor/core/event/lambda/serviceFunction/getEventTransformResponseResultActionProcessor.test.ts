import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

describe('lambda/serviceFunction getEventTransformResponseResultActionProcessor', () => {
  it('returns the record straight back to the caller', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: true, result: 'value' };

    expect(await processor({ eventParams: [{}], qpqEventRecordResponses: [record] })).toEqual([record]);
  });
});
