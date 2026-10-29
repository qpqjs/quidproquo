import { askKeyValueStoreUpsertWithRetry, AskResponse } from '@qpqjs/core';

import { Connection } from '../../types/Connection';
import { askConnectionGetStoreName } from './askConnectionGetStoreName';

export function* askConnectionUpsert(connection: Connection): AskResponse<void> {
  const storeName = yield* askConnectionGetStoreName();

  yield* askKeyValueStoreUpsertWithRetry(storeName, connection);
}
