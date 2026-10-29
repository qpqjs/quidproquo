import { ErrorTypeEnum, EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

describe('dynamo/streamEvent getEventTransformResponseResultActionProcessor', () => {
  it('answers nothing when every record was projected', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [result, error] = await processor({ eventParams: [{ Records: [] }, {}], qpqEventRecordResponses: [{ success: true, result: undefined }] });

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
  });

  // A failed projection must fail the batch, so Lambda retries it rather than the shard silently skipping a change.
  it('fails the whole batch when any record errored', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [, error] = await processor({
      eventParams: [{ Records: [] }, {}],
      qpqEventRecordResponses: [
        { success: true, result: undefined },
        { success: false, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'boom' } },
      ],
    });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(error?.errorText).toContain('[1] stream records');
  });
});
