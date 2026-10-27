// Reduces an action into [newState, handled]. Unhandled actions bubble up the
// component tree to the nearest QpqRuntimeEffectCatcher.
export type QpqBubbleReducer<S, A> = (prevState: S, action: A) => [S, boolean];
