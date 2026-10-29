import { askKeyValueStoreUpsert, AskResponse, QPQ_LOGS_STORAGE_DRIVE_NAME } from '@qpqjs/core';

import { LogMetadata } from '../../entry/domain/LogMetadata';

export function* askLogMetadataUpsert(logMetadata: LogMetadata): AskResponse<void> {
  yield* askKeyValueStoreUpsert(QPQ_LOGS_STORAGE_DRIVE_NAME, logMetadata);
}
