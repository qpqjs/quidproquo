import { askMap, AskResponse } from '@qpqjs/core';

import { askEventDocReadOwnedStoreNames } from '../actions/askEventDocReadOwnedStoreNames';
import { EventDocReprojectSource } from '../models';
import { askEventDocReprojectStart } from './askEventDocReprojectStart';

/**
 * Start a reproject walk of every event-doc collection this service owns, each on its own queue. Returns the store
 * names it started, once their first messages are queued. Safe to run at any time and again: a document already up to
 * date costs a few reads. `source` says where each walk finds its documents (see EventDocReprojectSource).
 */
export function* askEventDocReprojectOwnedStores(source: EventDocReprojectSource = EventDocReprojectSource.Lists): AskResponse<string[]> {
  const storeNames = yield* askEventDocReadOwnedStoreNames();

  yield* askMap(storeNames, function* askStartOne(storeName: string) {
    yield* askEventDocReprojectStart(storeName, source);
  });

  return storeNames;
}
