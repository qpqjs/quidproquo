import { askConfigGetGlobal, AskResponse, QueueEvent, QueueEventResponse, QueueMessage } from '@qpqjs/core';

import { REPORT_NAME_GLOBAL } from '../../constants/reportNameGlobal';
import { askReportEventsFold } from '../../logic/askReportEventsFold';

/** The report queue's handler: folds one message into its month documents. The report name arrives as a function global. */
export function* onReportEvents(event: QueueEvent<QueueMessage<unknown>>): AskResponse<QueueEventResponse> {
  const reportName = yield* askConfigGetGlobal<string>(REPORT_NAME_GLOBAL);

  yield* askReportEventsFold(reportName, event.id, event.groupId, event.message.payload);

  return true;
}
