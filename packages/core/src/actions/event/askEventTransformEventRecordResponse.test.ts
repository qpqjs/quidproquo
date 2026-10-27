import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, throwsError } from '../../testing';
import { askEventTransformEventRecordResponse } from './askEventTransformEventRecordResponse';
import { EventActionType } from './EventActionType';

describe('askEventTransformEventRecordResponse', () => {
  it('yields a TransformEventRecordResponse action with the supplied record', () => {
    const eventRecord = { raw: 'response' };

    const { action } = captureRequester(askEventTransformEventRecordResponse(eventRecord));

    expect(action).toEqual({
      type: EventActionType.TransformEventRecordResponse,
      payload: { eventRecord },
    });
  });

  // Regression: this requester used to be a copy of askEventTransformEventRecord and
  // yielded TransformEventRecord, so the response transform could never be dispatched.
  it('yields the response action type, not the record one', () => {
    const { action } = captureRequester(askEventTransformEventRecordResponse({ raw: 'response' }));

    expect(action.type).toBe(EventActionType.TransformEventRecordResponse);
    expect(action.type).not.toBe(EventActionType.TransformEventRecord);
  });

  it('returns the transformed record the runtime resolves', () => {
    const transformed = { id: 'qpq' };
    const { returned } = captureRequester(askEventTransformEventRecordResponse({ raw: 'response' }), transformed);

    expect(returned).toBe(transformed);
  });

  it('propagates a processor failure as a thrown story error', () => {
    const failingRun = () =>
      runStory(askEventTransformEventRecordResponse({ raw: 'response' }), {
        [EventActionType.TransformEventRecordResponse]: throwsError('GenericError', 'transform failed'),
      });

    expect(failingRun).toThrow('GenericError: transform failed');
  });
});
