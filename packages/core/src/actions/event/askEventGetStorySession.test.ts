import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, throwsError } from '../../testing';
import { askEventGetStorySession } from './askEventGetStorySession';
import { EventActionType } from './EventActionType';

describe('askEventGetStorySession', () => {
  it('yields a GetStorySession action with params, record and match result', () => {
    const eventParams = ['a', 'b'];
    const record = { id: 'r1' };
    const matchResult = { matched: true } as any;

    const { action } = captureRequester(askEventGetStorySession(eventParams, record, matchResult));

    expect(action).toEqual({
      type: EventActionType.GetStorySession,
      payload: { eventParams, qpqEventRecord: record, matchStoryResult: matchResult },
    });
  });

  it('returns the session the runtime resolves', () => {
    const session = { sessionId: 's1' };
    const { returned } = captureRequester(askEventGetStorySession(['a'], { id: 'r1' }, { matched: true } as any), session);

    expect(returned).toBe(session);
  });

  it('propagates a processor failure as a thrown story error', () => {
    const failingRun = () =>
      runStory(askEventGetStorySession(['a'], { id: 'r1' }, { matched: true } as any), {
        [EventActionType.GetStorySession]: throwsError('GenericError', 'session lookup failed'),
      });

    expect(failingRun).toThrow('GenericError: session lookup failed');
  });
});
