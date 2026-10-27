import { describe, expect, it } from 'vitest';

import { askRandomNumber } from '../../actions/math/askRandomNumber';
import { MathActionType } from '../../actions/math/MathActionType';
import { askStateDispatch } from '../../actions/state/askStateDispatch';
import { askStateRead } from '../../actions/state/askStateRead';
import { askStateDispatchEffect } from '../../logic/stateEffects/askStateDispatchEffect';
import { buildMutableEffectReducer } from '../../logic/stateEffects/buildMutableEffectReducer';
import { Effect } from '../../logic/stateEffects/Effect';
import { AskResponse, EitherActionResult } from '../../types';
import { askCatch } from '../system/askCatch';
import { askReduceState } from './askReduceState';

// ─── Test fixtures ───────────────────────────────────────────────────────────

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

enum MarkEffect {
  Mark = 'mark/Mark',
}

type MarkMarkEffect = Effect<MarkEffect.Mark, string>;
type MarkEffects = MarkMarkEffect;

interface MarkState {
  marks: string[];
}

const markReducer = buildMutableEffectReducer<MarkState, MarkEffects>({
  [MarkEffect.Mark]: (state, label) => {
    state.marks.push(label);
  },
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('askReduceState', () => {
  it('accumulates dispatched effects into the returned state', () => {
    function* logic(): AskResponse<void> {
      yield* askStateDispatch<CounterEffects>({ type: CounterEffect.Increment, payload: undefined });
      yield* askStateDispatchEffect<AddEffect>(CounterEffect.Add, 5);
      yield* askStateDispatch<CounterEffects>({ type: CounterEffect.Increment, payload: undefined });
    }

    const gen = askReduceState<CounterState, CounterEffects>({ count: 0 }, counterReducer, logic);
    const result = gen.next();

    // Every state action is captured internally, so the generator runs to completion with no runtime.
    expect(result.done).toBe(true);
    expect(result.value).toEqual({ count: 7 });
  });

  it('askStateRead returns the current accumulated state mid-flight', () => {
    let observed: CounterState | null = null;

    function* logic(): AskResponse<void> {
      yield* askStateDispatchEffect<AddEffect>(CounterEffect.Add, 3);
      observed = yield* askStateRead<CounterState>();
      yield* askStateDispatchEffect<AddEffect>(CounterEffect.Add, 4);
    }

    const gen = askReduceState<CounterState, CounterEffects>({ count: 0 }, counterReducer, logic);
    const result = gen.next();

    expect(result.done).toBe(true);
    expect(observed).toEqual({ count: 3 });
    expect(result.value).toEqual({ count: 7 });
  });

  it('passes non-state actions through to the runtime', () => {
    function* logic(): AskResponse<void> {
      const n = yield* askRandomNumber();
      yield* askStateDispatchEffect<AddEffect>(CounterEffect.Add, n);
    }

    const gen = askReduceState<CounterState, CounterEffects>({ count: 0 }, counterReducer, logic);

    // The random-number action is not a state action, so it bubbles to the runtime.
    const s1 = gen.next();
    expect(s1.done).toBe(false);
    expect(s1.value).toEqual({ type: MathActionType.RandomNumber });

    // Runtime responds with 10; the dispatch that follows is captured.
    const s2 = gen.next(10);
    expect(s2.done).toBe(true);
    expect(s2.value).toEqual({ count: 10 });
  });

  it('bubbles effects the inner reducer does not handle up to the outer reducer', () => {
    let innerState: CounterState | null = null;
    let innerReadDuringRun: CounterState | null = null;

    function* innerLogic(): AskResponse<void> {
      yield* askStateDispatchEffect<AddEffect>(CounterEffect.Add, 2);
      innerReadDuringRun = yield* askStateRead<CounterState>();
      // counterReducer does not handle Mark -> [state, false] -> bubbles to the outer askReduceState.
      yield* askStateDispatchEffect<MarkMarkEffect>(MarkEffect.Mark, 'from-inner');
      yield* askStateDispatchEffect<AddEffect>(CounterEffect.Add, 3);
    }

    function* outerLogic(): AskResponse<void> {
      innerState = yield* askReduceState<CounterState, CounterEffects>({ count: 0 }, counterReducer, innerLogic);
    }

    const gen = askReduceState<MarkState, MarkEffects>({ marks: [] }, markReducer, outerLogic);
    const result = gen.next();

    expect(result.done).toBe(true);
    expect(innerState).toEqual({ count: 5 }); // Add effects handled by the inner reducer
    expect(innerReadDuringRun).toEqual({ count: 2 }); // inner read sees inner state, not outer
    expect(result.value).toEqual({ marks: ['from-inner'] }); // Mark bubbled up and handled by the outer reducer
  });

  it('does not double-wrap a read captured under askCatch', () => {
    let read: EitherActionResult<CounterState> | null = null;

    function* logic(): AskResponse<void> {
      yield* askStateDispatchEffect<AddEffect>(CounterEffect.Add, 4);
      // Read carries returnErrors:true here; the handler must return a RAW value so the
      // engine wraps it exactly once.
      read = yield* askCatch(askStateRead<CounterState>());
    }

    const gen = askReduceState<CounterState, CounterEffects>({ count: 0 }, counterReducer, logic);
    const result = gen.next();

    expect(result.done).toBe(true);
    expect(read).toEqual({ success: true, result: { count: 4 } });
  });

  it('forwards a bubbled dispatch result verbatim under askCatch (nested)', () => {
    let caught: EitherActionResult<void> | null = null;

    function* innerLogic(): AskResponse<void> {
      // Mark is unhandled by counterReducer -> bubbles to the outer markReducer. Wrapping the
      // dispatch in askCatch must yield a single-wrapped success, not a nested EitherActionResult.
      caught = yield* askCatch(askStateDispatchEffect<MarkMarkEffect>(MarkEffect.Mark, 'x'));
    }

    function* outerLogic(): AskResponse<void> {
      yield* askReduceState<CounterState, CounterEffects>({ count: 0 }, counterReducer, innerLogic);
    }

    const gen = askReduceState<MarkState, MarkEffects>({ marks: [] }, markReducer, outerLogic);
    const result = gen.next();

    expect(result.done).toBe(true);
    expect(result.value).toEqual({ marks: ['x'] }); // outer reducer handled the bubbled Mark
    expect(caught).toEqual({ success: true, result: undefined }); // single wrap — no nesting
  });
});
