import { askCatch, askFileReadTextContents, AskResponse, Nullable } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocStoredSnapshot } from '../types/EventDocStoredSnapshot';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { eventDocSnapshotPath } from './eventDocSnapshotPath';

/**
 * A snapshot row's state, inline or read from the blob drive. Null means unusable (missing blob); the wrapper
 * object keeps that distinct from a state that is legitimately null.
 */
export function* askEventDocSnapshotStateResolve(
  docId: string,
  viewName: string,
  row: EventDocStoredSnapshot,
): AskResponse<Nullable<{ state: unknown }>> {
  if (row.data.type === 'inline') {
    return { state: row.data.snapshot };
  }

  const { storageDriveName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const read = yield* askCatch(askFileReadTextContents(storageDriveName, eventDocSnapshotPath(docId, viewName, row.sk), scope));

  return read.success ? { state: JSON.parse(read.result) } : null;
}
