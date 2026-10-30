import { askKeyValueStoreUpsertWithRetry, AskResponse } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EventDocSummaryView } from '../models';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/** Bare upsert of a summary view, stamping `type` (the store's partition key) on the way in. Validation lives in the logic layer. */
export function* askEventDocUpsert(view: EventDocSummaryView): AskResponse<void> {
  const { storeName, type } = yield* askEventDocStoreReadOrThrow();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreUpsertWithRetry(storeName, { ...view, type }, { scope });
}
