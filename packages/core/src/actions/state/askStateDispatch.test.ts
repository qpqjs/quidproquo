import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askStateDispatch } from './askStateDispatch';
import { StateActionType } from './StateActionType';

describe('askStateDispatch', () => {
  it('yields a Dispatch action wrapping the dispatched action', () => {
    const dispatched = { type: 'increment', amount: 1 };

    const { action } = captureRequester(askStateDispatch(dispatched));

    expect(action).toEqual({ type: StateActionType.Dispatch, payload: { action: dispatched } });
  });

  it('resumes with no value once the runtime processes the dispatch', () => {
    const { returned } = captureRequester(askStateDispatch({ type: 'increment' }), undefined);

    expect(returned).toBeUndefined();
  });
});
