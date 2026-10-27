import { askKeyValueStoreDelete, AskResponse } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/** Drops one event slot by (modelId, eventId). Unguarded: the log is append-only, so only the transfer overwrite uses this. */
export function* askEventDocEventDelete(modelId: string, eventId: number): AskResponse<void> {
  const { eventsStoreName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreDelete(eventsStoreName, modelId, eventId, { scope });
}
