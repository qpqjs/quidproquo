import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, throwsError } from '../../testing';
import { askEventTransformEventRecord } from './askEventTransformEventRecord';
import { EventActionType } from './EventActionType';

describe('askEventTransformEventRecord', () => {
  it('yields a TransformEventRecord action with the supplied record', () => {
    const eventRecord = { raw: 'payload' };

    const { action } = captureRequester(askEventTransformEventRecord(eventRecord));

    expect(action).toEqual({
      type: EventActionType.TransformEventRecord,
      payload: { eventRecord },
    });
  });

  it('returns the transformed record the runtime resolves', () => {
    const transformed = { id: 'qpq' };
    const { returned } = captureRequester(askEventTransformEventRecord({ raw: 'payload' }), transformed);

    expect(returned).toBe(transformed);
  });

  it('propagates a processor failure as a thrown story error', () => {
    const failingRun = () =>
      runStory(askEventTransformEventRecord({ raw: 'payload' }), {
        [EventActionType.TransformEventRecord]: throwsError('GenericError', 'record transform failed'),
      });

    expect(failingRun).toThrow('GenericError: record transform failed');
  });
});
