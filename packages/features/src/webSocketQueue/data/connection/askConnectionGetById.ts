import { askKeyValueStoreQueryAll, AskResponse, kvsEqual } from '@qpqjs/core';

import { Connection } from '../../types/Connection';
import { askConnectionGetStoreName } from './askConnectionGetStoreName';

export function* askConnectionGetById(id: string): AskResponse<Connection | undefined> {
  const storeName = yield* askConnectionGetStoreName();

  const [connection] = yield* askKeyValueStoreQueryAll<Connection>(storeName, kvsEqual('id', id));

  return connection;
}
