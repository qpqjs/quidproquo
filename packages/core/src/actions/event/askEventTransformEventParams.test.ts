import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, throwsError } from '../../testing';
import { askEventTransformEventParams } from './askEventTransformEventParams';
import { EventActionType } from './EventActionType';

describe('askEventTransformEventParams', () => {
  it('yields a TransformEventParams action with the collected params', () => {
    const { action } = captureRequester(askEventTransformEventParams('a', 'b'));

    expect(action).toEqual({
      type: EventActionType.TransformEventParams,
      payload: { eventParams: ['a', 'b'] },
    });
  });

  it('yields an empty eventParams array when none are given', () => {
    const { action } = captureRequester(askEventTransformEventParams());

    expect(action).toEqual({
      type: EventActionType.TransformEventParams,
      payload: { eventParams: [] },
    });
  });

  it('returns the transformed params the runtime resolves', () => {
    const transformed = { ok: true };
    const { returned } = captureRequester(askEventTransformEventParams('a'), transformed);

    expect(returned).toBe(transformed);
  });

  it('propagates a processor failure as a thrown story error', () => {
    const failingRun = () =>
      runStory(askEventTransformEventParams('a'), {
        [EventActionType.TransformEventParams]: throwsError('GenericError', 'params transform failed'),
      });

    expect(failingRun).toThrow('GenericError: params transform failed');
  });
});
