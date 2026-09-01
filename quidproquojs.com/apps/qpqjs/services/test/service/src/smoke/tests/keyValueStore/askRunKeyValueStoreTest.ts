import {
  askKeyValueStoreDelete,
  askKeyValueStoreGet,
  askKeyValueStoreQuery,
  askKeyValueStoreUpdate,
  askKeyValueStoreUpsert,
  askNewGuid,
  AskResponse,
  kvsEqual,
  kvsIncrement,
  kvsUpdate,
} from 'quidproquo';

import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

import { askSmokeAssert } from '../askSmokeAssert';

// Every DynamoDB action the owned-table grant covers (PutItem, GetItem,
// UpdateItem, Query, DeleteItem), including a query that must be served by
// the GSI: the grant's `table/*/index/*` resource is a separate ARN shape, so
// index access is the part most likely to break on its own.
export function* askRunKeyValueStoreTest(): AskResponse<void> {
  const probeId = yield* askNewGuid();
  const category = `kvs-${probeId}`;

  const record: SmokeProbeRecord = { probeId, category, value: 1 };
  yield* askKeyValueStoreUpsert<SmokeProbeRecord>(SMOKE_PROBE_STORE, record);

  const written = yield* askKeyValueStoreGet<SmokeProbeRecord>(
    SMOKE_PROBE_STORE,
    probeId
  );
  yield* askSmokeAssert(
    written?.value === 1,
    'get after upsert did not return the written record'
  );

  yield* askKeyValueStoreUpdate(
    SMOKE_PROBE_STORE,
    kvsUpdate([kvsIncrement('value', 1)]),
    probeId
  );

  const updated = yield* askKeyValueStoreGet<SmokeProbeRecord>(
    SMOKE_PROBE_STORE,
    probeId
  );
  yield* askSmokeAssert(
    updated?.value === 2,
    'get after update did not see the increment'
  );

  // `category` is the GSI partition key, so this query is answered by the index.
  const byCategory = yield* askKeyValueStoreQuery<SmokeProbeRecord>(
    SMOKE_PROBE_STORE,
    kvsEqual('category', category)
  );
  yield* askSmokeAssert(
    byCategory.items.some((item) => item.probeId === probeId),
    'index query by category did not return the record'
  );

  yield* askKeyValueStoreDelete(SMOKE_PROBE_STORE, probeId);

  const deleted = yield* askKeyValueStoreGet<SmokeProbeRecord>(
    SMOKE_PROBE_STORE,
    probeId
  );
  yield* askSmokeAssert(!deleted, 'record still present after delete');
}
