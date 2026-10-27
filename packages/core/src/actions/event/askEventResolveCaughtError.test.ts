import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, throwsError } from '../../testing';
import { askEventResolveCaughtError } from './askEventResolveCaughtError';
import { EventActionType } from './EventActionType';

describe('askEventResolveCaughtError', () => {
  it('yields a ResolveCaughtError action with the supplied error', () => {
    const error = { errorType: 'GenericError', errorText: 'boom' } as any;

    const { action } = captureRequester(askEventResolveCaughtError(error));

    expect(action).toEqual({
      type: EventActionType.ResolveCaughtError,
      payload: { error },
    });
  });

  it('returns the transformed params the runtime resolves', () => {
    const resolved = { handled: true };
    const { returned } = captureRequester(askEventResolveCaughtError({ errorType: 'GenericError' } as any), resolved);

    expect(returned).toBe(resolved);
  });

  it('propagates a processor failure as a thrown story error', () => {
    const failingRun = () =>
      runStory(askEventResolveCaughtError({ errorType: 'GenericError', errorText: 'boom' } as any), {
        [EventActionType.ResolveCaughtError]: throwsError('GenericError', 'resolver failed'),
      });

    expect(failingRun).toThrow('GenericError: resolver failed');
  });
});
