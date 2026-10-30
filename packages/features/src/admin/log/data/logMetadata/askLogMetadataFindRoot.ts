import { AskResponse } from '@qpqjs/core';

import { LogMetadata } from '../../entry/domain/LogMetadata';
import { askLogMetadataGetByCorrelation } from './askLogMetadataGetByCorrelation';

// Walks the fromCorrelation chain up to the log that started it.
export function* askLogMetadataFindRoot(fromCorrelation?: string): AskResponse<LogMetadata | undefined> {
  if (!fromCorrelation) {
    return;
  }

  const parentLog = yield* askLogMetadataGetByCorrelation(fromCorrelation);
  return (yield* askLogMetadataFindRoot(parentLog?.fromCorrelation)) || parentLog;
}
