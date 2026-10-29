import { ErrorTypeEnum, EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

describe('schedule getEventTransformResponseResultActionProcessor', () => {
  it('answers nothing when the schedule story succeeded', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [result, error] = await processor({ eventParams: [{}], qpqEventRecordResponses: [{ success: true, result: undefined }] });

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
  });

  // The ticker logs the failure and carries on; the story's own error is what it sees.
  it("passes a failed story's error through", async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [, error] = await processor({
      eventParams: [{}],
      qpqEventRecordResponses: [{ success: false, error: { errorType: ErrorTypeEnum.NotFound, errorText: 'gone' } }],
    });

    expect(error).toEqual({ errorType: ErrorTypeEnum.NotFound, errorText: 'gone', errorStack: undefined });
  });

  it('fails when no record response arrived', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [, error] = await processor({ eventParams: [{}], qpqEventRecordResponses: [] });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
