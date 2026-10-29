import { askKeyValueStoreQueryAll, AskResponse, kvsEqual, QPQ_LOGS_STORAGE_DRIVE_NAME } from '@qpqjs/core';

import { LogMetadata } from '../../entry/domain/LogMetadata';

export function* askLogMetadataGetAllByFromCorrelation(fromCorrelation: string): AskResponse<LogMetadata[]> {
  return yield* askKeyValueStoreQueryAll<LogMetadata>(QPQ_LOGS_STORAGE_DRIVE_NAME, kvsEqual('fromCorrelation', fromCorrelation));
}
