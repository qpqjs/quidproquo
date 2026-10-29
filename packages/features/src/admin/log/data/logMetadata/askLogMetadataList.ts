import {
  askKeyValueStoreQuery,
  AskResponse,
  kvsAnd,
  kvsBetween,
  kvsContains,
  kvsEqual,
  kvsExists,
  KvsQueryCondition,
  QPQ_LOGS_STORAGE_DRIVE_NAME,
  QpqPagedData,
} from '@qpqjs/core';

import { LogMetadata } from '../../entry/domain/LogMetadata';
import { LogSearchQuery } from '../../entry/domain/LogSearchQuery';

export function* askLogMetadataList(query: LogSearchQuery): AskResponse<QpqPagedData<LogMetadata>> {
  const { runtimeType, startIsoDateTime, endIsoDateTime, errorFilter, serviceFilter, infoFilter, userFilter, onlyErrors, nextPageKey } = query;

  const filters: KvsQueryCondition[] = [];

  if (onlyErrors) {
    filters.push(kvsExists('error'));
  }

  if (serviceFilter) {
    filters.push(kvsEqual('moduleName', serviceFilter));
  }

  if (infoFilter) {
    filters.push(kvsContains('generic', infoFilter));
  }

  if (errorFilter) {
    filters.push(kvsContains('error', errorFilter));
  }

  if (userFilter) {
    filters.push(kvsContains('userInfo', userFilter));
  }

  const logs = yield* askKeyValueStoreQuery<LogMetadata>(
    QPQ_LOGS_STORAGE_DRIVE_NAME,
    kvsAnd([kvsEqual('runtimeType', runtimeType), kvsBetween('startedAt', startIsoDateTime, endIsoDateTime)]),
    {
      nextPageKey,
      filter: filters.length > 0 ? kvsAnd(filters) : undefined,
    },
  );

  return logs;
}
