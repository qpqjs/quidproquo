import { describe, expect, it } from 'vitest';

import { buildEffectReducer } from './buildEffectReducer';

interface CounterState {
  count: number;
}

type CounterEffect = { type: 'add'; payload: number } | { type: 'reset'; payload: undefined };

const reducer = buildEffectReducer<CounterState, CounterEffect>({
  add: (state, amount) => ({ count: state.count + amount }),
  reset: () => ({ count: 0 }),
});

describe('buildEffectReducer', () => {
  it('applies a handled effect and flags it as handled', () => {
    expect(reducer({ count: 1 }, { type: 'add', payload: 4 })).toEqual([{ count: 5 }, true]);
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

  // Security regression: a pushed or replayed effect is data; a prototype-shaped type with a payload must
  // leave the state object and the handlers map untouched, never define or call anything.
  it('leaves state and handlers untouched for a prototype-shaped effect carrying a payload', () => {
    const state = { count: 1 };
    const handlersBefore = Object.getOwnPropertyNames(Object.prototype).length;

    const [next, handled] = reducer(state, { type: '__proto__', payload: { polluted: true } } as unknown as CounterEffect);

    expect(handled).toBe(false);
    expect(next).toBe(state);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.getOwnPropertyNames(Object.prototype).length).toBe(handlersBefore);
  });
});
