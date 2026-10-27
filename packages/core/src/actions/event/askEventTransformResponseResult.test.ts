import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, throwsError } from '../../testing';
import { askEventTransformResponseResult } from './askEventTransformResponseResult';
import { EventActionType } from './EventActionType';

describe('askEventTransformResponseResult', () => {
  it('yields a TransformResponseResult action with the responses and collected params', () => {
    const responses = [{ success: true, result: { ok: 1 } }] as any;

    const { action } = captureRequester(askEventTransformResponseResult(responses, 'a', 'b'));

    expect(action).toEqual({
      type: EventActionType.TransformResponseResult,
      payload: { qpqEventRecordResponses: responses, eventParams: ['a', 'b'] },
    });
  });

  it('yields an empty eventParams array when none are given', () => {
    const responses = [] as any;

    const { action } = captureRequester(askEventTransformResponseResult(responses));

    expect(action).toEqual({
      type: EventActionType.TransformResponseResult,
      payload: { qpqEventRecordResponses: responses, eventParams: [] },
    });
  });

  it('returns the transformed response the runtime resolves', () => {
    const transformed = { statusCode: 200 };
    const { returned } = captureRequester(askEventTransformResponseResult([] as any), transformed);

    expect(returned).toBe(transformed);
  });

  it('propagates a processor failure as a thrown story error', () => {
    const failingRun = () =>
      runStory(askEventTransformResponseResult([] as any), {
        [EventActionType.TransformResponseResult]: throwsError('GenericError', 'response transform failed'),
      });

    expect(failingRun).toThrow('GenericError: response transform failed');
  });
});
