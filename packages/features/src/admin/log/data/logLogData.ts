import {
  askKeyValueStoreQuery,
  askKeyValueStoreQuerySingle,
  askKeyValueStoreUpsert,
  AskResponse,
  ErrorTypeEnum,
  kvsAnd,
  kvsBetween,
  kvsContains,
  kvsEqual,
  kvsNotExists,
  kvsOr,
  KvsQueryOperation,
  LogLevelEnum,
  Nullable,
  QPQ_LOGS_STORAGE_DRIVE_NAME,
  QpqPagedData,
} from '@qpqjs/core';

import { LogLog } from '../entry/domain';

const storeName = `${QPQ_LOGS_STORAGE_DRIVE_NAME}-list`;

export function* askLogLogUpsert(logLog: LogLog): AskResponse<void> {
  yield* askKeyValueStoreUpsert(storeName, logLog);
}

export function* askLogLogList(
  logLevel: LogLevelEnum,
  startDateTime: string,
  endDateTime: string,
  serviceFilter: string,
  reasonFilter: string,
  nextPageKey?: string,
): AskResponse<QpqPagedData<LogLog>> {
  const filters: KvsQueryOperation[] = [];

  if (reasonFilter) {
    filters.push(kvsContains('reason', reasonFilter));
  }

  if (serviceFilter) {
    filters.push(kvsOr([kvsNotExists('module'), kvsContains('module', serviceFilter)]));
  }

  const logs = yield* askKeyValueStoreQuery<LogLog>(
    storeName,
    kvsAnd([kvsEqual('type', logLevel), kvsBetween('timestamp', startDateTime, endDateTime)]),
    {
      nextPageKey,
      filter: filters.length > 0 ? kvsAnd(filters) : undefined,
    },
  );

  return logs;
}

export function* askLogLogGet(errorType: ErrorTypeEnum, timestamp: string): AskResponse<Nullable<LogLog>> {
  const log = yield* askKeyValueStoreQuerySingle<LogLog>(storeName, kvsAnd([kvsEqual('type', errorType), kvsEqual('timestamp', timestamp)]));

  return log;
}
