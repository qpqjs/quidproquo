import {
  askKeyValueStoreDelete,
  askKeyValueStoreQueryAll,
  askKeyValueStoreScan,
  askKeyValueStoreScanAll,
  askKeyValueStoreUpsertWithRetry,
  AskResponse,
  kvsEqual,
  kvsExists,
  QpqPagedData,
} from '@qpqjs/core';

import { getWebSocketQueueKeyValueStoreName } from '../config/defineWebSocketQueue';
import { askWebsocketApiNameReadOrThrow } from '../context';
import { Connection } from '../types/Connection';

export function* askConnectionGetStoreName(apiNameOverride?: string): AskResponse<string> {
  const apiName = apiNameOverride || (yield* askWebsocketApiNameReadOrThrow());

  return getWebSocketQueueKeyValueStoreName(apiName || 'UNKNOWN-API');
}

export function* askConnectionGetByUserId(userId: string): AskResponse<Connection[]> {
  const storeName = yield* askConnectionGetStoreName();

  const connections = yield* askKeyValueStoreQueryAll<Connection>(storeName, kvsEqual('userId', userId));

  return connections;
}

export function* askConnectionGetById(id: string): AskResponse<Connection | undefined> {
  const storeName = yield* askConnectionGetStoreName();

  const [connection] = yield* askKeyValueStoreQueryAll<Connection>(storeName, kvsEqual('id', id));

  return connection;
}

export function* askConnectionGetAll(): AskResponse<Connection[]> {
  const storeName = yield* askConnectionGetStoreName();

  const connections = yield* askKeyValueStoreScanAll<Connection>(storeName);
  return connections;
}

export function* askConnectionGetAllPaged(apiName: string, onlyAuthorized: boolean, nextPageKey?: string): AskResponse<QpqPagedData<Connection>> {
  const storeName = yield* askConnectionGetStoreName(apiName);

  const filter = onlyAuthorized ? kvsExists('userId') : undefined;

  return yield* askKeyValueStoreScan<Connection>(storeName, filter, nextPageKey);
}

export function* askConnectionDeleteByConnectionId(id: string): AskResponse<void> {
  const storeName = yield* askConnectionGetStoreName();

  yield* askKeyValueStoreDelete(storeName, id);
}

export function* askConnectionUpsert(connection: Connection): AskResponse<void> {
  const storeName = yield* askConnectionGetStoreName();

  yield* askKeyValueStoreUpsertWithRetry(storeName, connection);
}

export const webSocketConnectionData = {
  askConnectionGetByUserId,
  askConnectionGetById,
  askConnectionGetAll,
  askConnectionDeleteByConnectionId,
  askConnectionUpsert,
};
