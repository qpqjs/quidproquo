import { produce } from 'immer';

// Update the signature so that for each effect type K, we extract its payload type.
export function buildMutableEffectReducer<State, E extends { type: string; payload: any }>(handlers: {
  [K in E['type']]?: (state: State, payload: Extract<E, { type: K }>['payload']) => void;
}) {
  return (state: State, effect: E): [State, boolean] => {
    // Own-property lookup only: effects are replayed from stored event logs, so
    // a type like 'toString' or 'constructor' must be unhandled rather than
    // resolving to an inherited Object.prototype member and invoking it.
    const handler: any = Object.prototype.hasOwnProperty.call(handlers, effect.type) ? (handlers as any)[effect.type] : undefined;
    if (handler) {
      const nextState = produce(state, (draft: State) => {
        handler(draft, effect.payload);
      });
      return [nextState, true];
    }
    return [state, false];
  };
}
