import { askKeyValueStoreDelete, AskResponse } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/** Hard delete of the summary row. Internal cleanup only; the public lifecycle uses `askEventDocSoftDelete`. */
export function* askEventDocDelete(id: string): AskResponse<void> {
  const { storeName, type } = yield* askEventDocStoreReadOrThrow();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreDelete(storeName, type, id, { scope });
}
