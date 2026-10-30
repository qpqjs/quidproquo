import { askKeyValueStoreQuery, AskResponse, kvsEqual, QPQ_LOGS_STORAGE_DRIVE_NAME, QpqPagedData } from '@qpqjs/core';

import { LogMetadata } from '../../entry/domain/LogMetadata';

export function* askLogMetadataGetByFromCorrelation(fromCorrelation: string): AskResponse<QpqPagedData<LogMetadata>> {
  const logs = yield* askKeyValueStoreQuery<LogMetadata>(QPQ_LOGS_STORAGE_DRIVE_NAME, kvsEqual('fromCorrelation', fromCorrelation));

  return logs;
}
