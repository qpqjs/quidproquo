import { qpqCoreUtils } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL } from '../constants/eventDocGlobalNames';
import { EventDocFunctions } from '../definition/types/EventDocFunctions';
import { defineEventDoc } from './defineEventDoc';

const FUNCTIONS_RUNTIME = '/entry/eventDocs::memoEventDoc' as const;

const memoFunctions: EventDocFunctions = {
  storeName: 'memos',
  type: 'memo',
  foldSnapshotViews: () => null,
  foldDocumentState: () => null,
  collectReferencesFromState: () => [],
  collectReferences: () => [],
  validateEvent: () => null,
};

// The stream globals of the events store carry the snapshot map - dig them out of the
// emitted config the same way the deploy layer would.
const snapshotFunctionsGlobalOf = (config: ReturnType<typeof defineEventDoc>): Record<string, string> | undefined => {
  const eventsStore = qpqCoreUtils.getAllKeyValueStores(config).find((kvs) => kvs.keyValueStoreName === eventDocEventsStoreName('memos'));
  const runtime = eventsStore?.onStream?.runtime;

  return runtime && typeof runtime === 'object' ? (runtime.globals?.[EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL] as Record<string, string>) : undefined;
};

describe('defineEventDoc', () => {
  it('registers the functions object once and wires the snapshot map to its name', () => {
    const config = defineEventDoc(memoFunctions, FUNCTIONS_RUNTIME, { basePath: '/memos' });

    const dynamicFunctions = qpqCoreUtils.getAllDynamicFunctions(config);
    expect(dynamicFunctions).toHaveLength(1);
    expect(dynamicFunctions[0].dynamicFunctionsName).toBe(eventDocFunctionsName('memos', 'memo'));
    expect(dynamicFunctions[0].runtime).toBe(FUNCTIONS_RUNTIME);

    expect(snapshotFunctionsGlobalOf(config)).toEqual({ memo: eventDocFunctionsName('memos', 'memo') });
  });

  it('throws when the functions object carries no identity', () => {
    const identityless = { ...memoFunctions, storeName: undefined, type: undefined };

    expect(() => defineEventDoc(identityless, FUNCTIONS_RUNTIME, { basePath: '/memos' })).toThrow('no identity');
  });
});
