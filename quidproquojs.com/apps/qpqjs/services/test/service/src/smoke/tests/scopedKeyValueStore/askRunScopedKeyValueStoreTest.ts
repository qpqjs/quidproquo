import {
  askCatch,
  askKeyValueStoreDelete,
  askKeyValueStoreGet,
  askKeyValueStoreGetBase,
  askKeyValueStoreQuery,
  askKeyValueStoreUpsert,
  askKeyValueStoreUpsertBase,
  askNewGuid,
  AskResponse,
  kvsEqual,
} from 'quidproquo';

import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

import { SMOKE_SCOPED_PROBE_STORE } from '../../constants/smokeProbe';
import { askSmokeAssert } from '../askSmokeAssert';

// The scope gate on a store, on whichever backend is running: a scoped store
// serves scoped calls (including an index query) and keeps two scopes apart,
// refuses an unscoped call, and an unscoped store refuses a scoped one. On
// dynamo the scope is composed into the partition key, so the read-back also
// proves the composed form never leaks to the caller.
export function* askRunScopedKeyValueStoreTest(): AskResponse<void> {
  const probeId = yield* askNewGuid();
  const scopeA = `smoke-a-${probeId}`;
  const scopeB = `smoke-b-${probeId}`;
  const category = `scoped-kvs-${probeId}`;

  const record: SmokeProbeRecord = { probeId, category, value: 1 };
  yield* askKeyValueStoreUpsert<SmokeProbeRecord>(
    SMOKE_SCOPED_PROBE_STORE,
    record,
    { scope: scopeA }
  );

  const written = yield* askKeyValueStoreGet<SmokeProbeRecord>(
    SMOKE_SCOPED_PROBE_STORE,
    probeId,
    { scope: scopeA }
  );
  yield* askSmokeAssert(
    written?.probeId === probeId && written.value === 1,
    'scoped get did not return the record with its raw key'
  );

  const byCategory = yield* askKeyValueStoreQuery<SmokeProbeRecord>(
    SMOKE_SCOPED_PROBE_STORE,
    kvsEqual('category', category),
    { scope: scopeA }
  );
  yield* askSmokeAssert(
    byCategory.items.some((item) => item.probeId === probeId),
    'scoped index query by category did not return the record'
  );

  const fromB = yield* askKeyValueStoreGet<SmokeProbeRecord>(
    SMOKE_SCOPED_PROBE_STORE,
    probeId,
    { scope: scopeB }
  );
  yield* askSmokeAssert(
    !fromB,
    'record written under scope A is visible from scope B'
  );

  const unscopedGet = yield* askCatch(
    askKeyValueStoreGet<SmokeProbeRecord>(SMOKE_SCOPED_PROBE_STORE, probeId)
  );
  yield* askSmokeAssert(
    !unscopedGet.success &&
      unscopedGet.error.errorType ===
        askKeyValueStoreGetBase.errorType.InvalidScope,
    'unscoped get on the scoped store was not refused with InvalidScope'
  );

  const scopedUpsertOnUnscopedStore = yield* askCatch(
    askKeyValueStoreUpsert<SmokeProbeRecord>(SMOKE_PROBE_STORE, record, {
      scope: scopeA,
    })
  );
  yield* askSmokeAssert(
    !scopedUpsertOnUnscopedStore.success &&
      scopedUpsertOnUnscopedStore.error.errorType ===
        askKeyValueStoreUpsertBase.errorType.InvalidScope,
    'scoped upsert on the unscoped store was not refused with InvalidScope'
  );

  yield* askKeyValueStoreDelete(SMOKE_SCOPED_PROBE_STORE, probeId, undefined, {
    scope: scopeA,
  });

  const deleted = yield* askKeyValueStoreGet<SmokeProbeRecord>(
    SMOKE_SCOPED_PROBE_STORE,
    probeId,
    { scope: scopeA }
  );
  yield* askSmokeAssert(!deleted, 'scoped record still present after delete');
}
