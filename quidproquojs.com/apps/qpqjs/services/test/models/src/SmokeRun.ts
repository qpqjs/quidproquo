import { Nullable } from 'quidproquo';

import { SmokeRunStatus } from './SmokeRunStatus';
import { SmokeTestResult } from './SmokeTestResult';

// One smoke run: POST /smoke/run creates it, GET /smoke/run/{runId} polls it.
// The shape is the part-2 contract; part 3 only grows what `tests` contains.
export type SmokeRun = {
  runId: string;
  status: SmokeRunStatus;
  startedAt: string;
  finishedAt: Nullable<string>;
  tests: SmokeTestResult[];
};
