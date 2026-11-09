import { askConfigGetGlobal, askLogCreate, AskResponse, askStorageScopeProvide, LogLevelEnum } from '@qpqjs/core';

import { askEventDocStoreProvide } from '../../eventDoc/context/askEventDocStoreProvide';
import { buildEventDocStore } from '../../eventDoc/context/buildEventDocStore';
import { reportConfigGlobal } from '../constants/reportConfigGlobal';
import { REPORT_MONTH_DOC_TYPE } from '../constants/reportMonthDocType';
import { reportStoreName } from '../constants/reportStoreName';
import { ReportsConfig } from '../models/ReportsConfig';
import { askReportMonthsAppend } from './askReportMonthsAppend';
import { buildReportMonthBatches } from './buildReportMonthBatches';
import { readReportEventSettings } from './readReportEventSettings';
import { readReportEventsMessage } from './readReportEventsMessage';
import { resolveReportMonthLimits } from './resolveReportMonthLimits';

/**
 * Folds one queue message into its month documents, in the scope it was appended under. A message whose group does not
 * match its scope and type is refused and logged; malformed events are dropped with one warning; neither is retried,
 * because a redelivery would be refused again. Everything else is appended once, however often SQS delivers it.
 */
export function* askReportEventsFold(reportName: string, messageId: string, groupId: string | undefined, payload: unknown): AskResponse<void> {
  const read = readReportEventsMessage(payload, groupId);

  if ('problem' in read) {
    yield* askLogCreate(LogLevelEnum.Error, `[reports] ${reportName}: refused message ${messageId}: ${read.problem}`);
    return;
  }

  const { message } = read;
  const config = yield* askConfigGetGlobal<ReportsConfig>(reportConfigGlobal(reportName));
  const settings = readReportEventSettings(config, message.type);
  const batches = buildReportMonthBatches(message, settings);

  if (batches.droppedCount > 0) {
    yield* askLogCreate(
      LogLevelEnum.Warn,
      `[reports] ${reportName}: dropped ${batches.droppedCount} of ${message.events.length} '${message.type}' event(s) in message ${messageId}: ${batches.dropReason}`,
    );
  }

  if (batches.months.length === 0) {
    return;
  }

  const store = buildEventDocStore({ storeName: reportStoreName(reportName), type: REPORT_MONTH_DOC_TYPE });
  // eslint-disable-next-line qpq/require-yield-star
  const append = askEventDocStoreProvide(store, askReportMonthsAppend(batches.months, messageId, resolveReportMonthLimits(settings)));

  // Re-enter the scope the events were appended under; folding under another would write one tenant's counts into another's.
  if (message.scope === null) {
    yield* append;
    return;
  }

  yield* askStorageScopeProvide(message.scope, append);
}
