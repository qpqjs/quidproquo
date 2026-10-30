import { ErrorTypeEnum, EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

const buildS3Record = (eventName: string, key: string): any => ({ eventName, s3: { object: { key } } });

describe('s3/fileEvent getEventTransformResponseResultActionProcessor', () => {
  it('returns void when every file processed successfully', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    expect(await processor({ eventParams: [{}], qpqEventRecordResponses: [{ success: true, result: {} }] })).toEqual([undefined]);
  });

  it('returns a generic error when any file failed', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const responses = [
      { success: true, result: {} },
      { success: false, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'x' } },
    ];

    const [, error] = await processor({ eventParams: [{}], qpqEventRecordResponses: responses });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(error?.errorText).toBe('[1] files unable to be processed.');
  });
});
