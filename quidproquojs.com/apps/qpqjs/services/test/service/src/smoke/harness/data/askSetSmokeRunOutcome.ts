import {
  askKeyValueStoreUpdate,
  AskResponse,
  kvsSet,
  kvsUpdate,
} from 'quidproquo';

import { SmokeRun, SmokeRunStatus } from '@qpqjs/test-models';

import { SMOKE_RUNS_STORE } from '../constants/SMOKE_RUNS_STORE';

// Stamps the run's terminal status. Only the status and finish time are
// written, so it cannot undo a test result that landed in the meantime.
export function* askSetSmokeRunOutcome(
  runId: string,
  status: SmokeRunStatus,
  finishedAt: string
): AskResponse<SmokeRun> {
  return yield* askKeyValueStoreUpdate<SmokeRun>(
    SMOKE_RUNS_STORE,
    kvsUpdate([kvsSet('status', status), kvsSet('finishedAt', finishedAt)]),
    runId
  );
}
