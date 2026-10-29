import { askKeyValueStoreQuery, AskResponse, kvsEqual, QPQ_LOGS_STORAGE_DRIVE_NAME } from '@qpqjs/core';

import { LogMetadata } from '../../entry/domain/LogMetadata';

export function* askLogMetadataGetByCorrelation(correlation: string): AskResponse<LogMetadata | undefined> {
  const logs = yield* askKeyValueStoreQuery<LogMetadata>(QPQ_LOGS_STORAGE_DRIVE_NAME, kvsEqual('correlation', correlation));

  return logs.items[0];
}
