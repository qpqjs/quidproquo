// The data on every event a smoke writer appends: which run and which writer produced
// it, and its position within that writer's batch (0 for a single append). The tests
// read these back off the log to prove every writer landed exactly once and every
// batch stayed consecutive.
export type SmokeEventDocMark = {
  runId: string;
  writerId: number;
  seq: number;
};
