import { QpqReducer } from './combineQpqReducers';

// Pure, synchronous reduction of a list of effects into state: the event-sourcing counterpart to
// askReduceState. Each effect is run through `reducer` in order, starting from `initialState`.
// Effects the reducer doesn't handle (it returns [state, false]) leave the state unchanged and are
// skipped. Returns the final recomputed state.
//
// `Effect` is inferred from the reducer, so the `effects` array is type-checked against it.
export const replayEffects = <State, Effect>(initialState: State, reducer: QpqReducer<State, Effect>, effects: Effect[]): State => {
  return effects.reduce((state, effect) => reducer(state, effect)[0], initialState);
};
