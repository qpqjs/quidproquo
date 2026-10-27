import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askStateRead } from './askStateRead';
import { StateActionType } from './StateActionType';

describe('askStateRead', () => {
  it('yields a Read action scoped to the given path', () => {
    const { action } = captureRequester(askStateRead('user/name'));

    expect(action).toEqual({ type: StateActionType.Read, payload: { path: 'user/name' } });
  });

  it('leaves the path undefined to read the whole state', () => {
    const { action } = captureRequester(askStateRead());

    expect(action.payload).toEqual({ path: undefined });
  });

  it('returns the state value the runtime resolves', () => {
    const { returned } = captureRequester(askStateRead<number>('count'), 7);

    expect(returned).toBe(7);
  });
});
