export function buildEffectReducer<State, Effect extends { type: string; payload: any }>(handlers: {
  [K in Effect['type']]?: (state: State, payload: Extract<Effect, { type: K }>['payload']) => State;
}) {
  return (state: State, effect: Effect): [State, boolean] => {
    // Own-property lookup only: effects are replayed from stored event logs, so
    // a type like 'toString' or 'constructor' must be unhandled rather than
    // resolving to an inherited Object.prototype member and invoking it.
    const handler = Object.prototype.hasOwnProperty.call(handlers, effect.type) ? handlers[effect.type as Effect['type']] : undefined;
    if (handler) {
      return [handler(state, effect.payload), true];
    }
    return [state, false];
  };
}
