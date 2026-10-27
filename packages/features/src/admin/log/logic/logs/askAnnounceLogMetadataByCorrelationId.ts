import { AskResponse } from 'quidproquo-core';

import * as logMetadataData from '../../entry/data/logMetadataData';
import { askSendLogToAdmins } from '../webSocket';

export function* askAnnounceLogMetadataByCorrelationId(correlationId: string): AskResponse<void> {
  const logMetadata = yield* logMetadataData.askGetByCorrelation(correlationId);

  if (logMetadata) {
    yield* askSendLogToAdmins(logMetadata);
  }
}
