import { AskResponse } from '@qpqjs/core';

import { askEventDocEventLast } from '../../eventDoc/data/askEventDocEventLast';
import { askEventDocAppendServerEvents } from '../../eventDoc/logic/askEventDocAppendServerEvents';
import { askEventDocCreate } from '../../eventDoc/logic/askEventDocCreate';
import { REPORT_SYSTEM_ACTOR } from '../../systemUsers/reportSystemActor';
import { REPORT_MONTH_SCHEMA_VERSION } from '../constants/reportMonthSchemaVersion';
import { ReportMonthEffect } from '../fold/effects/ReportMonthEffect';
import { ReportMonthLimits } from '../models/ReportMonthLimits';
import { ReportMonthBatch } from '../types/ReportMonthBatch';
import { askReportMonthHoldsMessage } from './askReportMonthHoldsMessage';

/**
 * Appends one message's events to its month document, creating the document on its first event. Skipped when the message
 * is already among the document's last appends (SQS delivered it again). Create-if-missing is safe only because one FIFO
 * group, so one writer, owns the document. Assumes the store context and the scope.
 */
export function* askReportMonthAppend(month: ReportMonthBatch, messageId: string, limits: ReportMonthLimits): AskResponse<void> {
  const head = yield* askEventDocEventLast(month.docId, { consistentRead: true });

  if (!head) {
    yield* askEventDocCreate(month.code, month.code, REPORT_SYSTEM_ACTOR, month.docId);
  }

  const alreadyAppended = head ? yield* askReportMonthHoldsMessage(month.docId, head.payload.metadata.eventId, messageId) : false;

  if (alreadyAppended) {
    return;
  }

  yield* askEventDocAppendServerEvents(
    month.docId,
    [
      {
        type: ReportMonthEffect.AppendEvents,
        data: { limits, events: month.events },
        version: REPORT_MONTH_SCHEMA_VERSION,
        clientMessageId: messageId,
      },
    ],
    REPORT_SYSTEM_ACTOR,
  );
}
