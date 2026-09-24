import {
  askCatch,
  askDelay,
  askKeyValueStoreDelete,
  askKeyValueStoreGet,
  askKeyValueStoreGetBase,
  askKeyValueStoreQuery,
  askKeyValueStoreQueryBase,
  askKeyValueStoreUpdate,
  askKeyValueStoreUpsert,
  askKeyValueStoreUpsertBase,
  askNewGuid,
  AskResponse,
  kvsEqual,
  kvsSet,
  kvsUpdate,
} from 'quidproquo';

import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { SMOKE_SCOPED_PROBE_STORE } from '../constants/SMOKE_SCOPED_PROBE_STORE';

const INDEX_POLL_ATTEMPTS = 10;
const INDEX_POLL_INTERVAL_MS = 1000;

const probeIdsOf = (items: SmokeProbeRecord[]): string =>
  items
    .map((item) => item.probeId)
    .sort()
    .join(',');

// GSI reads are eventually consistent, so poll until the scoped category
// index shows exactly the expected rows, returning the last read either way
// for the caller to assert on.
function* askSmokeScopedCategoryQuery(
  category: string,
  scope: string,
  expectedProbeIds: string[]
): AskResponse<SmokeProbeRecord[]> {
  const expected = [...expectedProbeIds].sort().join(',');

  let items: SmokeProbeRecord[] = [];
  for (let attempt = 0; attempt < INDEX_POLL_ATTEMPTS; attempt += 1) {
    const page = yield* askKeyValueStoreQuery<SmokeProbeRecord>(
      SMOKE_SCOPED_PROBE_STORE,
      kvsEqual('category', category),
      { scope }
    );
    items = page.items;
    if (probeIdsOf(items) === expected) {
      return items;
    }

    yield* askDelay(INDEX_POLL_INTERVAL_MS);
  }

  return items;
}

// The scope gate on a store, on whichever backend is running: a scoped store
// serves scoped calls (including queries on the pk and on a GSI) and keeps two
// scopes apart, refuses an unscoped call, and an unscoped store refuses a
// scoped one. On dynamo the scope is composed into the partition key and into
// a hidden copy of each GSI partition key, so the reads also prove neither
// composed form leaks to the caller, and a page key can't cross scopes.
export function* askRunScopedKeyValueStoreTest(): AskResponse<void> {
  const probeId = yield* askNewGuid();
  const otherProbeId = yield* askNewGuid();
  const scopeA = `smoke-a-${probeId}`;
  const scopeB = `smoke-b-${probeId}`;
  const category = `scoped-kvs-${probeId}`;
  const movedCategory = `scoped-kvs-moved-${probeId}`;

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

  const byKey = yield* askKeyValueStoreQuery<SmokeProbeRecord>(
    SMOKE_SCOPED_PROBE_STORE,
    kvsEqual('probeId', probeId),
    { scope: scopeA }
  );
  yield* askSmokeAssert(
    byKey.items.some((item) => item.category === category),
    'scoped query by partition key did not return the record'
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

  // The same category under another scope: the category GSI must only ever
  // answer with the querying scope's own rows.
  yield* askKeyValueStoreUpsert<SmokeProbeRecord>(
    SMOKE_SCOPED_PROBE_STORE,
    { probeId: otherProbeId, category, value: 2 },
    { scope: scopeB }
  );

  const byCategory = yield* askSmokeScopedCategoryQuery(category, scopeA, [
    probeId,
  ]);
  yield* askSmokeAssert(
    probeIdsOf(byCategory) === probeId,
    `scoped index query returned [${probeIdsOf(byCategory)}], expected only [${probeId}]`
  );
  yield* askSmokeAssert(
    byCategory.every((item) =>
      Object.keys(item).every((attribute) => !attribute.includes('@@QPQ'))
    ),
    'scoped index query leaked a reserved @@QPQ attribute'
  );

  // Paging a scoped index: the scope's own page key (a real DynamoDB page key,
  // carrying the hidden index copy) continues the listing, and the same key
  // used from another scope is refused rather than read.
  const pagedProbeId = yield* askNewGuid();
  yield* askKeyValueStoreUpsert<SmokeProbeRecord>(
    SMOKE_SCOPED_PROBE_STORE,
    { probeId: pagedProbeId, category, value: 3 },
    { scope: scopeB }
  );

  const scopeBRows = [otherProbeId, pagedProbeId].sort().join(',');
  const indexedInB = yield* askSmokeScopedCategoryQuery(category, scopeB, [
    otherProbeId,
    pagedProbeId,
  ]);
  yield* askSmokeAssert(
    probeIdsOf(indexedInB) === scopeBRows,
    'scoped index never showed both of scope B rows'
  );

  const firstPage = yield* askKeyValueStoreQuery<SmokeProbeRecord>(
    SMOKE_SCOPED_PROBE_STORE,
    kvsEqual('category', category),
    { scope: scopeB, limit: 1 }
  );
  yield* askSmokeAssert(
    firstPage.items.length === 1 && !!firstPage.nextPageKey,
    'scoped index query with limit 1 did not return a page key'
  );

  const secondPage = yield* askKeyValueStoreQuery<SmokeProbeRecord>(
    SMOKE_SCOPED_PROBE_STORE,
    kvsEqual('category', category),
    { scope: scopeB, limit: 1, nextPageKey: firstPage.nextPageKey }
  );
  yield* askSmokeAssert(
    probeIdsOf([...firstPage.items, ...secondPage.items]) === scopeBRows,
    'paging the scoped index did not walk both of scope B rows'
  );

  const pageKeyFromOtherScope = yield* askCatch(
    askKeyValueStoreQuery<SmokeProbeRecord>(
      SMOKE_SCOPED_PROBE_STORE,
      kvsEqual('category', category),
      { scope: scopeA, nextPageKey: firstPage.nextPageKey }
    )
  );
  yield* askSmokeAssert(
    !pageKeyFromOtherScope.success &&
      pageKeyFromOtherScope.error.errorType ===
        askKeyValueStoreQueryBase.errorType.InvalidScope,
    'scope B page key was not refused from scope A'
  );

  // Changing the indexed attribute moves the row's index entry with it.
  yield* askKeyValueStoreUpdate(
    SMOKE_SCOPED_PROBE_STORE,
    kvsUpdate([kvsSet('category', movedCategory)]),
    probeId,
    undefined,
    { scope: scopeA }
  );

  const moved = yield* askSmokeScopedCategoryQuery(movedCategory, scopeA, [
    probeId,
  ]);
  yield* askSmokeAssert(
    probeIdsOf(moved) === probeId,
    'scoped index query did not follow the updated category'
  );

  const leftBehind = yield* askSmokeScopedCategoryQuery(category, scopeA, []);
  yield* askSmokeAssert(
    leftBehind.length === 0,
    'scoped index query still found the record under its old category'
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
  yield* askKeyValueStoreDelete(
    SMOKE_SCOPED_PROBE_STORE,
    otherProbeId,
    undefined,
    { scope: scopeB }
  );
  yield* askKeyValueStoreDelete(
    SMOKE_SCOPED_PROBE_STORE,
    pagedProbeId,
    undefined,
    { scope: scopeB }
  );

  const deleted = yield* askKeyValueStoreGet<SmokeProbeRecord>(
    SMOKE_SCOPED_PROBE_STORE,
    probeId,
    { scope: scopeA }
  );
  yield* askSmokeAssert(!deleted, 'scoped record still present after delete');
}
