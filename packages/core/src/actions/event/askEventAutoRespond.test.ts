import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, throwsError } from '../../testing';
import { askEventAutoRespond } from './askEventAutoRespond';
import { EventActionType } from './EventActionType';

describe('askEventAutoRespond', () => {
  it('yields an AutoRespond action with the record and match result', () => {
    const record = { id: 'r1' };
    const matchResult = { matched: true } as any;

    const { action } = captureRequester(askEventAutoRespond(record, matchResult));

    expect(action).toEqual({
      type: EventActionType.AutoRespond,
      payload: { qpqEventRecord: record, matchResult },
    });
  });

  it('returns the response the runtime resolves', () => {
    const { returned } = captureRequester(askEventAutoRespond({ id: 'r1' }, { matched: true } as any), { status: 200 });

    expect(returned).toEqual({ status: 200 });
  });

  it('propagates a processor failure as a thrown story error', () => {
    const failingRun = () =>
      runStory(askEventAutoRespond({ id: 'r1' }, { matched: true } as any), {
        [EventActionType.AutoRespond]: throwsError('GenericError', 'auto respond failed'),
      });

    expect(failingRun).toThrow('GenericError: auto respond failed');
  });
});
