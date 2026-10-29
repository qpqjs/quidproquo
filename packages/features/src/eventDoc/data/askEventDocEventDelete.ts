import { askKeyValueStoreDelete, AskResponse } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/** Drops one event slot by (modelId, eventId). Unguarded: the log is append-only, so only the transfer overwrite uses this. */
export function* askEventDocEventDelete(modelId: string, eventId: number): AskResponse<void> {
  const { eventsStoreName } = yield* askEventDocStoreReadOrThrow();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreDelete(eventsStoreName, modelId, eventId, { scope });
}
