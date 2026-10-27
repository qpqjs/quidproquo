export type QpqReducer<State, Effect> = (state: State, effect: Effect) => [State, boolean];

export const combineQpqReducers = <State, EffectA, EffectB>(
  reducerA: QpqReducer<State, EffectA>,
  reducerB: QpqReducer<State, EffectB>,
): QpqReducer<State, EffectA | EffectB> => {
  return (state: State, effect: EffectA | EffectB): [State, boolean] => {
    const [stateA, handledA] = reducerA(state, effect as EffectA);
    if (handledA) {
      return [stateA, true];
    }

    return reducerB(stateA, effect as EffectB);
  };
};
