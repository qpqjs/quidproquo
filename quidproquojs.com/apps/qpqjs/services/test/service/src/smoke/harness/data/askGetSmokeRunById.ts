import { askKeyValueStoreGet, AskResponse, Nullable } from 'quidproquo';

import { SmokeRun } from '@qpqjs/test-models';

import { SMOKE_RUNS_STORE } from '../constants/SMOKE_RUNS_STORE';

export function* askGetSmokeRunById(
  runId: string
): AskResponse<Nullable<SmokeRun>> {
  const smokeRun = yield* askKeyValueStoreGet<SmokeRun>(
    SMOKE_RUNS_STORE,
    runId
  );

  return smokeRun || null;
}
