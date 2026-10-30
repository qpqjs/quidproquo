import { describe, expect, it } from 'vitest';

import { SharedQueryParamsEffect } from './effects/SharedQueryParamsEffect';
import { SharedQueryParamsSetParamEffect } from './effects/SharedQueryParamsSetParamEffect';
import { createInitialSharedQueryParamsState } from './logic/createInitialSharedQueryParamsState';
import { sharedQueryParamsReducer } from './sharedQueryParamsReducer';

const sharedQueryParamsInitialState = createInitialSharedQueryParamsState();

describe('sharedQueryParamsReducer', () => {
  it('stores the values under the key on SetParam', () => {
    const effect: SharedQueryParamsSetParamEffect = {
      type: SharedQueryParamsEffect.SetParam,
      payload: { key: 'tab', values: ['one', 'two'] },
    };

    const [state, preventBubble] = sharedQueryParamsReducer(sharedQueryParamsInitialState, effect);

    expect(state).toEqual({ tab: ['one', 'two'] });
    expect(preventBubble).toBe(true);
  });

  it('does not mutate the previous state', () => {
    const effect: SharedQueryParamsSetParamEffect = {
      type: SharedQueryParamsEffect.SetParam,
      payload: { key: 'tab', values: ['one'] },
    };

    sharedQueryParamsReducer(sharedQueryParamsInitialState, effect);

    expect(sharedQueryParamsInitialState).toEqual({});
  });

  it('passes through unknown effects without bubbling prevention', () => {
    const [state, preventBubble] = sharedQueryParamsReducer({ a: ['1'] }, { type: 'unknown', payload: undefined } as any);

    expect(state).toEqual({ a: ['1'] });
    expect(preventBubble).toBe(false);
  });
});
