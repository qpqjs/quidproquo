import { AskResponse, askStorageScopeProvide } from '@qpqjs/core';

import { askEventDocStoreProvide } from '../context/askEventDocStoreProvide';
import { buildEventDocStore } from '../context/buildEventDocStore';
import { EventDocReprojectTarget } from '../models';
import { askEventDocReprojectHead } from './askEventDocReprojectHead';
import { askEventDocSummaryRederive } from './askEventDocSummaryRederive';

/**
 * Re-run the projector at one document's head, in the storage scope it lives under: its list view rows are rewritten
 * and a fresh snapshot set is filed under the collection's current cache key. `snapshotFunctions` is the store's map
 * of doc type to registered functions name; a type with no entry has only its summary to rebuild. Idempotent, and a
 * document already up to date costs a few reads and a refused write.
 */
export function* askEventDocReprojectDocument(
  storeName: string,
  { type, docId, scope }: EventDocReprojectTarget,
  snapshotFunctions: Record<string, string>,
): AskResponse<void> {
  const functionsName = snapshotFunctions[type];

  // Through the registered fold when the doc type has one, as the stream projector does; else only its summary can be rebuilt.
  // eslint-disable-next-line qpq/require-yield-star
  const project = askEventDocStoreProvide(
    buildEventDocStore({ storeName, type }),
    functionsName ? askEventDocReprojectHead(docId, functionsName) : askEventDocSummaryRederive(docId),
  );

  // Projecting under the wrong scope would write one tenant's doc into another's partition.
  if (scope === undefined) {
    yield* project;

    return;
  }

  yield* askStorageScopeProvide(scope, project);
}
