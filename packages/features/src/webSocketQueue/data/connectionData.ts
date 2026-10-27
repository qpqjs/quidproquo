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
} from 'quidproquo-core';

import { getWebSocketQueueKeyValueStoreName } from '../config/defineWebSocketQueue';
import { askWebsocketReadApiNameOrThrow } from '../context/websocketConnectionInfoContext';
import { Connection } from '../types/Connection';

export function* askGetStoreName(apiNameOverride?: string): AskResponse<string> {
  const apiName = apiNameOverride || (yield* askWebsocketReadApiNameOrThrow());

  return getWebSocketQueueKeyValueStoreName(apiName || 'UNKNOWN-API');
}

export function* askGetConnectionsByUserId(userId: string): AskResponse<Connection[]> {
  const storeName = yield* askGetStoreName();

  const connections = yield* askKeyValueStoreQueryAll<Connection>(storeName, kvsEqual('userId', userId));

  return connections;
}

export function* askGetById(id: string): AskResponse<Connection | undefined> {
  const storeName = yield* askGetStoreName();

  const [connection] = yield* askKeyValueStoreQueryAll<Connection>(storeName, kvsEqual('id', id));

  return connection;
}

export function* askGetAllConnections(): AskResponse<Connection[]> {
  const storeName = yield* askGetStoreName();

  const connections = yield* askKeyValueStoreScanAll<Connection>(storeName);
  return connections;
}

export function* askGetAllPagedConnections(apiName: string, onlyAuthorized: boolean, nextPageKey?: string): AskResponse<QpqPagedData<Connection>> {
  const storeName = yield* askGetStoreName(apiName);

  const filter = onlyAuthorized ? kvsExists('userId') : undefined;

  return yield* askKeyValueStoreScan<Connection>(storeName, filter, nextPageKey);
}

export function* askDeleteByConnectionId(id: string): AskResponse<void> {
  const storeName = yield* askGetStoreName();

  yield* askKeyValueStoreDelete(storeName, id);
}

export function* askUpsert(connection: Connection): AskResponse<void> {
  const storeName = yield* askGetStoreName();

  yield* askKeyValueStoreUpsertWithRetry(storeName, connection);
}

export const webSocketConnectionData = {
  askGetConnectionsByUserId,
  askGetById,
  askGetAllConnections,
  askDeleteByConnectionId,
  askUpsert,
};
