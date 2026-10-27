import { describe, expect, it } from 'vitest';

import { buildMutableEffectReducer } from './buildMutableEffectReducer';

interface CounterState {
  count: number;
}

type CounterEffect = { type: 'add'; payload: number } | { type: 'reset'; payload: undefined };

const reducer = buildMutableEffectReducer<CounterState, CounterEffect>({
  add: (state, amount) => {
    state.count += amount;
  },
  reset: (state) => {
    state.count = 0;
  },
});

describe('buildMutableEffectReducer', () => {
  it('applies a handled effect immutably and flags it as handled', () => {
    const state = { count: 1 };
    const [next, handled] = reducer(state, { type: 'add', payload: 4 });

    expect(handled).toBe(true);
    expect(next).toEqual({ count: 5 });
    expect(state).toEqual({ count: 1 });
    expect(next).not.toBe(state);
  });

  it('returns the untouched state and false for an unhandled effect', () => {
    const state = { count: 1 };
    const [next, handled] = reducer(state, { type: 'unknown', payload: undefined } as unknown as CounterEffect);

    expect(handled).toBe(false);
    expect(next).toBe(state);
  });

  it('treats Object.prototype member names as unhandled effect types', () => {
    // Effects can be replayed from stored event logs; a type like 'toString'
    // must never resolve to an inherited prototype member and get invoked.
    const state = { count: 1 };

    for (const type of ['toString', 'constructor', 'hasOwnProperty', '__proto__', 'valueOf']) {
      const [next, handled] = reducer(state, { type, payload: undefined } as unknown as CounterEffect);

      expect(handled).toBe(false);
      expect(next).toBe(state);
    }
  });
});
