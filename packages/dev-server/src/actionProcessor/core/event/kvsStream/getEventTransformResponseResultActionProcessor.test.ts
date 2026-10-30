import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

describe('kvsStream getEventTransformResponseResultActionProcessor', () => {
  it('answers nothing: a local stream handler has no caller to report to', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [result, error] = await processor({ eventParams: [{}], qpqEventRecordResponses: [{ success: true, result: undefined }] });

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
  });
});
