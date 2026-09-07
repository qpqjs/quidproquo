import { askKeyValueStoreDelete, AskResponse } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { askEventDocResolveScope } from './askEventDocResolveScope';

// Bare storage op, the mirror of askEventDocEventWrite: drop ONE event slot by its (modelId, eventId)
// key. Deliberately unguarded and unused by any normal flow - the log is append-only, and the only
// caller is the transfer's explicit overwrite, which backs the events up before calling it.
export function* askEventDocEventDelete(modelId: string, eventId: number): AskResponse<void> {
  const { eventsStoreName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreDelete(eventsStoreName, modelId, eventId, { scope });
}
