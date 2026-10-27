import { describe, expect, it } from 'vitest';

import { combineQpqReducers, QpqReducer } from './combineQpqReducers';

interface State {
  log: string[];
}

const reducerA: QpqReducer<State, string> = (state, effect) => {
  if (effect === 'a') {
    return [{ log: [...state.log, 'A'] }, true];
  }
  return [state, false];
};

const reducerB: QpqReducer<State, string> = (state, effect) => {
  if (effect === 'b') {
    return [{ log: [...state.log, 'B'] }, true];
  }
  return [state, false];
};

describe('combineQpqReducers', () => {
  const combined = combineQpqReducers(reducerA, reducerB);

  it('uses the first reducer when it handles the effect', () => {
    expect(combined({ log: [] }, 'a')).toEqual([{ log: ['A'] }, true]);
  });

  it('falls through to the second reducer when the first does not handle it', () => {
    expect(combined({ log: [] }, 'b')).toEqual([{ log: ['B'] }, true]);
  });

  it('passes the first reducer state through to the second on a miss', () => {
    const passthroughA: QpqReducer<State, string> = (state) => [{ log: [...state.log, 'A?'] }, false];

    const result = combineQpqReducers(passthroughA, reducerB)({ log: [] }, 'b');

    expect(result).toEqual([{ log: ['A?', 'B'] }, true]);
  });

  it('reports unhandled when neither reducer handles the effect', () => {
    const state = { log: [] };

    expect(combined(state, 'z')).toEqual([{ log: [] }, false]);
  });
});
