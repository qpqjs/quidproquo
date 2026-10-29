import { qpqCoreUtils } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL, EVENT_DOC_STORE_NAME_GLOBAL } from '../constants/eventDocGlobalNames';
import { defineEventDocSummary } from './defineEventDocSummary';

// Security regression: the three stores of a collection share one scoped flag and keep point in time
// recovery on, and the stream projector learns the store name and snapshot map from config globals, never
// from the row it is handed.
describe('defineEventDocSummary', () => {
  it('declares the summary, events and snapshot stores with recovery on and one shared scoped flag', () => {
    const stores = qpqCoreUtils.getAllKeyValueStoreConfigs(defineEventDocSummary('memos', { scoped: true }));

    expect(stores).toHaveLength(3);
    expect(stores.every((kvs) => kvs.disablePointInTimeRecovery === false)).toBe(true);
    expect(stores.every((kvs) => kvs.scoped === true)).toBe(true);
    expect(qpqCoreUtils.getStorageDrives(defineEventDocSummary('memos', { scoped: true })).map((drive) => drive.scoped)).toEqual([true]);
  });

  it('hands the projector its store name and snapshot map as config globals', () => {
    const config = defineEventDocSummary('memos', { snapshotFunctions: { memo: 'memos-memo-functions' } });
    const eventsStore = qpqCoreUtils.getAllKeyValueStoreConfigs(config).find((kvs) => kvs.keyValueStoreName === eventDocEventsStoreName('memos'));
    const runtime = eventsStore?.onStream?.runtime;

    expect(runtime && typeof runtime === 'object' ? runtime.globals : undefined).toEqual({
      [EVENT_DOC_STORE_NAME_GLOBAL]: 'memos',
      [EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL]: { memo: 'memos-memo-functions' },
    });
    expect(eventsStore?.onStream?.coalesceByPartitionKey).toBe(true);
  });
});
