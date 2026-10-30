import { AskResponse } from '@qpqjs/core';

import * as logMetadataData from '../../data/logMetadata';
import { askLogSendToAdmins } from '../webSocket';

export function* askAnnounceLogMetadataByCorrelationId(correlationId: string): AskResponse<void> {
  const logMetadata = yield* logMetadataData.askLogMetadataGetByCorrelation(correlationId);

  if (logMetadata) {
    yield* askLogSendToAdmins(logMetadata);
  }
}
