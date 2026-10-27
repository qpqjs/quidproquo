/** The handler shape buildEffectReducer expects. Partial: an unhandled effect bubbles so a combined reducer can pick it up. */
export type EffectHandlers<TState, TEffect extends { type: string; payload: unknown }> = {
  [K in TEffect['type']]?: (state: TState, payload: Extract<TEffect, { type: K }>['payload']) => TState;
};
