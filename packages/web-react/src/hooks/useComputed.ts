export function useComputed<TState extends object, T>(state: TState, selector: (state: TState) => T): T {
  // TODO: @joe-coady: use proxies to resolve deps and only return updated values when the deps change.
  return selector(state);
}
