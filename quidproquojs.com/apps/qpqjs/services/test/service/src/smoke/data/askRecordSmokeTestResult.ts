import {
  askKeyValueStoreUpdate,
  AskResponse,
  KvsAdvancedDataType,
  kvsSet,
  kvsUpdate,
} from 'quidproquo';

import { SmokeRun, SmokeTestResult } from '@qpqjs/test-models';

import { SMOKE_RUNS_STORE } from '../constants/SMOKE_RUNS_STORE';

// Writes one test's entry into the run record, touching nothing else, so the
// tests running in parallel cannot clobber each other the way a whole-record
// upsert would. Returns the record as it stands after this write: updates to
// one item are serialized by the store, so the returned `tests` include every
// result recorded before this one.
export function* askRecordSmokeTestResult(
  runId: string,
  testIndex: number,
  result: SmokeTestResult
): AskResponse<SmokeRun> {
  // A completed entry carries no nulls, but the KVS value type cannot express
  // that the model's Nullable timestamps are filled in by now.
  const value = result as unknown as KvsAdvancedDataType;

  return yield* askKeyValueStoreUpdate<SmokeRun>(
    SMOKE_RUNS_STORE,
    kvsUpdate([kvsSet(['tests', testIndex], value)]),
    runId
  );
}
