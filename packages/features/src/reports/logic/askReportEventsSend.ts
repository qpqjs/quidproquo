import { askCatch, askEventBusSendMessages, askGuidNewSortableMany, askLogCreate, AskResponse, LogLevelEnum, Nullable } from '@qpqjs/core';

import { reportEventBusName } from '../constants/reportEventBusName';
import { ReportEventsMessage } from '../models/ReportEventsMessage';
import { ReportQueuedEvent } from '../models/ReportQueuedEvent';
import { buildReportEventsMessages } from './buildReportEventsMessages';

/**
 * Publishes checked events to the report's bus, one message per event type. A failed send is logged at error and
 * dropped, never thrown: a count is a side effect of what happened and must not fail it; the error log keeps the loss visible.
 */
export function* askReportEventsSend(reportName: string, scope: Nullable<string>, events: ReportQueuedEvent[]): AskResponse<void> {
  const types = new Set(events.map((event) => event.type));
  const deduplicationIds = yield* askGuidNewSortableMany(types.size);

  const sent = yield* askCatch(
    askEventBusSendMessages<ReportEventsMessage>({
      eventBusName: reportEventBusName(reportName),
      eventBusMessages: buildReportEventsMessages(scope, events, deduplicationIds),
    }),
  );

  if (!sent.success) {
    yield* askLogCreate(
      LogLevelEnum.Error,
      `[reports] ${reportName}: lost ${events.length} event(s) of ${[...types].join(', ')}, the send failed: ${sent.error.errorText}`,
    );
  }
}
