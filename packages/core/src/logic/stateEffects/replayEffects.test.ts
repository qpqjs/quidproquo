import { describe, expect, it } from 'vitest';

import { buildMutableEffectReducer } from './buildMutableEffectReducer';
import { Effect } from './Effect';
import { replayEffects } from './replayEffects';

enum CounterEffect {
  Increment = 'counter/Increment',
  Add = 'counter/Add',
}

type IncrementEffect = Effect<CounterEffect.Increment>;
type AddEffect = Effect<CounterEffect.Add, number>;
type CounterEffects = IncrementEffect | AddEffect;

interface CounterState {
  count: number;
}

const counterReducer = buildMutableEffectReducer<CounterState, CounterEffects>({
  [CounterEffect.Increment]: (state) => {
    state.count += 1;
  },
  [CounterEffect.Add]: (state, amount) => {
    state.count += amount;
  },
});

describe('replayEffects', () => {
  it('reduces a list of effects into the final state', () => {
    const effects: CounterEffects[] = [
      { type: CounterEffect.Increment, payload: undefined },
      { type: CounterEffect.Add, payload: 5 },
      { type: CounterEffect.Increment, payload: undefined },
    ];

    expect(replayEffects({ count: 0 }, counterReducer, effects)).toEqual({ count: 7 });
  });

  it('returns the initial state for an empty list', () => {
    expect(replayEffects({ count: 3 }, counterReducer, [])).toEqual({ count: 3 });
  });

  it('skips effects the reducer does not handle', () => {
    const effects = [
      { type: CounterEffect.Add, payload: 2 },
      { type: 'counter/Unknown', payload: 99 },
      { type: CounterEffect.Add, payload: 3 },
    ] as CounterEffects[];

    expect(replayEffects({ count: 0 }, counterReducer, effects)).toEqual({ count: 5 });
  });

  it('does not mutate the initial state', () => {
    const initial = { count: 1 };
    replayEffects(initial, counterReducer, [{ type: CounterEffect.Add, payload: 10 }]);
    expect(initial).toEqual({ count: 1 });
  });
});
