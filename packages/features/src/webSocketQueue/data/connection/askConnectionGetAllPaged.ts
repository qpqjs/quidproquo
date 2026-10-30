import { askKeyValueStoreScan, AskResponse, kvsExists, QpqPagedData } from '@qpqjs/core';

import { Connection } from '../../types/Connection';
import { askConnectionGetStoreName } from './askConnectionGetStoreName';

export function* askConnectionGetAllPaged(apiName: string, onlyAuthorized: boolean, nextPageKey?: string): AskResponse<QpqPagedData<Connection>> {
  const storeName = yield* askConnectionGetStoreName(apiName);

  const filter = onlyAuthorized ? kvsExists('userId') : undefined;

  return yield* askKeyValueStoreScan<Connection>(storeName, filter, nextPageKey);
}
