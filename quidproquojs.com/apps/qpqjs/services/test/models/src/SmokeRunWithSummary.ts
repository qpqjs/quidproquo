import { SmokeRun } from './SmokeRun';
import { SmokeRunSummary } from './SmokeRunSummary';

// What GET /smoke/run/{runId} returns: the stored run plus derived counts.
export type SmokeRunWithSummary = SmokeRun & {
  summary: SmokeRunSummary;
};
