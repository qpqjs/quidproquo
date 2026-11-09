import { Nullable } from '@qpqjs/core';

import { REPORT_EVENT_TYPE_PATTERN } from '../constants/reportEventTypePattern';
import { ReportQueuedEvent } from '../models/ReportQueuedEvent';
import { ReportEventsMessageRead } from '../types/ReportEventsMessageRead';
import { isReportRecord } from './isReportRecord';
import { reportGroupId } from './reportGroupId';
import { reportUnknownKeyProblem } from './reportUnknownKeyProblem';

const isScope = (scope: unknown): scope is Nullable<string> => scope === null || (typeof scope === 'string' && scope.length > 0);

/**
 * A queue payload as a report events message, or the reason it is not one. The FIFO group must be the one the scope and
 * type name, so a message cannot fold events into a scope other than the one its lane belongs to. Events are checked one
 * by one later; here they only have to be a list.
 */
export const readReportEventsMessage = (payload: unknown, groupId: string | undefined): ReportEventsMessageRead => {
  if (!isReportRecord(payload)) {
    return { problem: 'the payload is not an object' };
  }

  const { scope, type, events } = payload;
  const problem =
    reportUnknownKeyProblem(payload, ['scope', 'type', 'events']) ??
    (isScope(scope) ? null : 'scope must be a scope or null') ??
    (typeof type === 'string' && REPORT_EVENT_TYPE_PATTERN.test(type) ? null : 'type is not an event type') ??
    (Array.isArray(events) ? null : 'events must be a list');

  if (problem !== null || !isScope(scope) || typeof type !== 'string' || !Array.isArray(events)) {
    return { problem: problem ?? 'the payload is not a report events message' };
  }

  if (groupId !== reportGroupId(scope, type)) {
    return { problem: `the message group '${groupId ?? ''}' is not '${reportGroupId(scope, type)}', the group its scope and type name` };
  }

  // Each event is checked before it is used (buildReportMonthBatches); until then this is only a list.
  return { message: { scope, type, events: events as ReportQueuedEvent[] } };
};
