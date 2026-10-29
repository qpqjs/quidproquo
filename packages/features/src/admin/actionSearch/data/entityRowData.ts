import {
  askKeyValueStoreQuery,
  askKeyValueStoreUpsert,
  askMapParallel,
  AskResponse,
  kvsAnd,
  kvsBetween,
  kvsEqual,
  KvsQueryOperation,
  Nullable,
  QpqPagedData,
} from '@qpqjs/core';

import { QPQ_LOG_ENTITIES_KVS_NAME } from '../constants/qpqLogEntitiesKvsName';
import { ActionSearchEntityRow } from '../domain/ActionSearchEntityRow';

const entityRowStoreName = QPQ_LOG_ENTITIES_KVS_NAME;

export function* askEntityRowUpsert(entityRow: ActionSearchEntityRow): AskResponse<void> {
  yield* askKeyValueStoreUpsert(entityRowStoreName, entityRow);
}

export function* askEntityRowListByEntityType(
  entityType: string,
  startIsoDateTime: string,
  endIsoDateTime: string,
  filter?: KvsQueryOperation,
  nextPageKey?: string,
): AskResponse<QpqPagedData<ActionSearchEntityRow>> {
  return yield* askKeyValueStoreQuery<ActionSearchEntityRow>(
    entityRowStoreName,
    kvsAnd([kvsEqual('entityType', entityType), kvsBetween('createdAt', startIsoDateTime, endIsoDateTime)]),
    {
      nextPageKey,
      filter,
    },
  );
}

export function* askEntityRowGetByLinkKey(linkKey: string): AskResponse<Nullable<ActionSearchEntityRow>> {
  const entities = yield* askKeyValueStoreQuery<ActionSearchEntityRow>(entityRowStoreName, kvsEqual('linkKey', linkKey));

  return entities.items[0] ?? null;
}

export function* askEntityRowGetByLinkKeys(linkKeys: string[]): AskResponse<ActionSearchEntityRow[]> {
  const entities = yield* askMapParallel(linkKeys, askEntityRowGetByLinkKey);

  return entities.filter((entity): entity is ActionSearchEntityRow => !!entity);
}
