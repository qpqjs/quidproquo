/** Runs async work with at most a fixed number of executions in flight; the rest wait their turn. */
export type ConcurrencyGate = {
  run: <T>(work: () => Promise<T>) => Promise<T>;
};
