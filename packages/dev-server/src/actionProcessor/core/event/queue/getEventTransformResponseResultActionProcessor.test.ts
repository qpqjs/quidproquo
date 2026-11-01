import { ErrorTypeEnum, EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

describe('queue getEventTransformResponseResultActionProcessor', () => {
  it('answers nothing when the queue story succeeded', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [result, error] = await processor({ eventParams: [{}], qpqEventRecordResponses: [{ success: true, result: undefined }] });

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
  });

  // The local queue redelivers on a failed delivery, as SQS does for a record in batchItemFailures, so a failed
  // story (or an unmatched message) must come back as the event's failure rather than as success.
  it("passes a failed story's error through so the message is retried", async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [, error] = await processor({
      eventParams: [{}],
      qpqEventRecordResponses: [{ success: false, error: { errorType: ErrorTypeEnum.NotFound, errorText: 'no story for that type' } }],
    });

    expect(error).toEqual({ errorType: ErrorTypeEnum.NotFound, errorText: 'no story for that type', errorStack: undefined });
  });

  it('fails when no record response arrived', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [, error] = await processor({ eventParams: [{}], qpqEventRecordResponses: [] });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
