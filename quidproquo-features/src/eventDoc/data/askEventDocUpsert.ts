import { askKeyValueStoreUpsertWithRetry, AskResponse } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocSummaryView } from '../models';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/** Bare upsert of a summary view, stamping `type` (the store's partition key) on the way in. Validation lives in the logic layer. */
export function* askEventDocUpsert(view: EventDocSummaryView): AskResponse<void> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreUpsertWithRetry(storeName, { ...view, type }, { scope });
}
