import { ErrorTypeEnum, EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

describe('eventBridgeEvent/recurringSchedule getEventTransformResponseResultActionProcessor', () => {
  it('returns void for a successful record', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    expect(await processor({ eventParams: [{}], qpqEventRecordResponses: [{ success: true, result: {} }] })).toEqual([undefined]);
  });

  it('propagates a failed record as an error result', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [, error] = await processor({
      eventParams: [{}],
      qpqEventRecordResponses: [{ success: false, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'boom' } }],
    });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
