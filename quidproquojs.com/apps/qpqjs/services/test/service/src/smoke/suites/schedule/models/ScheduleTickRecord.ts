// The single row the whole schedule chain writes to, one field per actor:
//
//   requestedAt    the smoke test, seeding the run
//   processedAt    the schedule, when its minute comes round
//   acknowledgedAt the store's own change stream, having seen processedAt
//
// `runId` is the smoke run that seeded it, so what the test reads back is
// provably its own rather than the previous run's. Nothing is ever deleted: a
// stale row is one whose runId does not match, so there is no window where the
// record is missing.
export type ScheduleTickRecord = {
  scheduleName: string;
  runId: string;
  requestedAt: string;
  processedAt?: string;
  acknowledgedAt?: string;
};
