import { askKeyValueStoreQueryAll, AskResponse, kvsEqual } from '@qpqjs/core';

import { Connection } from '../../types/Connection';
import { askConnectionGetStoreName } from './askConnectionGetStoreName';

export function* askConnectionGetByUserId(userId: string): AskResponse<Connection[]> {
  const storeName = yield* askConnectionGetStoreName();

  const connections = yield* askKeyValueStoreQueryAll<Connection>(storeName, kvsEqual('userId', userId));

  return connections;
}
