import { askKeyValueStoreUpdatePartialProperties, AskResponse, QPQ_LOGS_STORAGE_DRIVE_NAME } from '@qpqjs/core';

import { LogMetadata } from '../../entry/domain/LogMetadata';

export function* askLogMetadataSetChecked(correlation: string, checked: boolean, checkedBy: string): AskResponse<LogMetadata> {
  return yield* askKeyValueStoreUpdatePartialProperties<LogMetadata, 'correlation'>(QPQ_LOGS_STORAGE_DRIVE_NAME, 'correlation', {
    correlation,
    checked,
    checkedBy,
  });
}
