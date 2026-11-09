import { AskResponse } from '@qpqjs/core';

import { EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW } from '../../eventDoc/constants/eventDocRecentClientMessageIdWindow';
import { askEventDocEventListAll } from '../../eventDoc/data/askEventDocEventListAll';

/**
 * Whether a queue message is already among a month document's last appends: the same window the fold dedups over, read
 * straight off the log tail so a redelivery is skipped without folding the document. Assumes the store context.
 */
export function* askReportMonthHoldsMessage(docId: string, headEventId: number, messageId: string): AskResponse<boolean> {
  const tail = yield* askEventDocEventListAll(docId, {
    consistentRead: true,
    afterEventId: headEventId - EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW,
    upToEventId: headEventId,
  });

  return tail.some((event) => event.payload.metadata.clientMessageId === messageId);
}
