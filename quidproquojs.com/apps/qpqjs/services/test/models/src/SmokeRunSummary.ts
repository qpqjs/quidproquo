// Counts derived from a run's test entries at read time, never stored, so they
// cannot drift from the entries themselves.
export type SmokeRunSummary = {
  total: number;
  completed: number;
  passed: number;
  failed: number;
};
