import { EventBusMessage, Nullable } from '@qpqjs/core';

import { REPORT_EVENTS_MESSAGE_TYPE } from '../constants/reportEventsMessageType';
import { ReportEventsMessage } from '../models/ReportEventsMessage';
import { ReportQueuedEvent } from '../models/ReportQueuedEvent';
import { reportGroupId } from './reportGroupId';

/** One bus message per event type in an append, each in its scope and type's FIFO group; `deduplicationIds` pair up by type. */
export const buildReportEventsMessages = (
  scope: Nullable<string>,
  events: ReportQueuedEvent[],
  deduplicationIds: string[],
): EventBusMessage<ReportEventsMessage>[] =>
  [...new Set(events.map((event) => event.type))].map((type, index) => ({
    type: REPORT_EVENTS_MESSAGE_TYPE,
    payload: { scope, type, events: events.filter((event) => event.type === type) },
    groupId: reportGroupId(scope, type),
    deduplicationId: deduplicationIds[index] ?? `${type}-${index}`,
  }));
