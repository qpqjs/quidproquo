import { askKeyValueStoreUpsert, AskResponse } from 'quidproquo';

import { SmokeRun } from '@qpqjs/test-models';

import { SMOKE_RUNS_STORE } from '../constants/SMOKE_RUNS_STORE';

export function* askSaveSmokeRun(smokeRun: SmokeRun): AskResponse<void> {
  yield* askKeyValueStoreUpsert<SmokeRun>(SMOKE_RUNS_STORE, smokeRun);
}
