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
  QpqRuntimeType,
} from '@qpqjs/core';

import { LogMetadata } from '../../entry/domain/LogMetadata';

export function* askLogMetadataList(
  runtimeType: QpqRuntimeType,
  startDateTime: string,
  endDateTime: string,
  errorFilter: string,
  serviceFilter: string,
  infoFilter: string,
  userFilter: string,
  onlyErrors: boolean,
  nextPageKey?: string,
): AskResponse<QpqPagedData<LogMetadata>> {
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
    kvsAnd([kvsEqual('runtimeType', runtimeType), kvsBetween('startedAt', startDateTime, endDateTime)]),
    {
      nextPageKey,
      filter: filters.length > 0 ? kvsAnd(filters) : undefined,
    },
  );

  return logs;
}
