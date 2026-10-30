import { ErrorTypeEnum, EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

const config = buildTestQpqConfig();

const buildEvent = (stackName: string, status: string): any => ({
  detail: { 'status-details': { status }, 'stack-id': `arn:aws:cloudformation:us-east-1:1:stack/${stackName}/abc` },
});

describe('eventBridgeEvent/deployStack getEventTransformResponseResultActionProcessor', () => {
  it('returns void for a successful record', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult, config);

    expect(await processor({ eventParams: [{}], qpqEventRecordResponses: [{ success: true, result: {} }] })).toEqual([undefined]);
  });

  it('propagates a failed record as an error result', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult, config);

    const [, error] = await processor({
      eventParams: [{}],
      qpqEventRecordResponses: [{ success: false, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'boom' } }],
    });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
