import { KeyValueStoreActionType, runStory } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { askEventDocStoreRead } from '../context/askEventDocStoreRead';
import { EventDocFunctions } from '../definition/types/EventDocFunctions';
import { createEventDocBackend } from './createEventDocBackend';

const memoFunctions: EventDocFunctions = {
  storeName: 'memos',
  type: 'memo',
  getSnapshotCacheKey: () => '',
  foldSnapshotViews: () => null,
  foldDocumentState: () => null,
  collectReferencesFromState: () => [],
  collectReferences: () => [],
  validateEvent: () => null,
};

describe('createEventDocBackend', () => {
  it('binds the generic verbs to the definition identity - no hand-provided context', () => {
    const backend = createEventDocBackend(memoFunctions);
    const queriedStores: string[] = [];

    const events = runStory(backend.askEventListAll('doc-1'), {
      [KeyValueStoreActionType.Query]: (action: { payload: { keyValueStoreName: string } }) => {
        queriedStores.push(action.payload.keyValueStoreName);
        return { items: [], nextPageKey: undefined };
      },
    });

    expect(events).toEqual([]);
    // The read hit the DEFINITION's events table: the store context came from the closure.
    expect(queriedStores).toEqual([eventDocEventsStoreName('memos')]);
  });

  it('askProvideStore runs an arbitrary story under the collection context', () => {
    const backend = createEventDocBackend(memoFunctions);
    const queriedStores: string[] = [];

    runStory(backend.askProvideStore(backend.askGetByIdOrThrow('doc-1')), {
      [KeyValueStoreActionType.Query]: (action: { payload: { keyValueStoreName: string } }) => {
        queriedStores.push(action.payload.keyValueStoreName);
        return { items: [{ id: 'doc-1', type: 'memo' }], nextPageKey: undefined };
      },
    });

    expect(queriedStores).toEqual(['memos']);
  });

  it('carries the definition sync option into the store context, so backend appends push head-moved', () => {
    const backend = createEventDocBackend({ ...memoFunctions, sync: { websocketApiName: 'ws' } });

    const store = runStory(backend.askProvideStore(askEventDocStoreRead()), {});

    expect(store.syncWebsocketApiNames).toEqual(['ws']);
  });

  it('leaves the store context without a websocket when the definition has no sync', () => {
    const backend = createEventDocBackend(memoFunctions);

    const store = runStory(backend.askProvideStore(askEventDocStoreRead()), {});

    expect(store.syncWebsocketApiNames).toEqual([]);
  });

  it('throws at build time for a definition with no identity', () => {
    const identityless: EventDocFunctions = {
      getSnapshotCacheKey: () => '',
      foldSnapshotViews: () => null,
      foldDocumentState: () => null,
      collectReferencesFromState: () => [],
      collectReferences: () => [],
      validateEvent: () => null,
    };

    expect(() => createEventDocBackend(identityless)).toThrow('no identity');
  });
});
