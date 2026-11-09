import { askConfigGetGlobal, askDateNow, AskResponse, askThrowError, ErrorTypeEnum, getUtcOffsetMinutes } from '@qpqjs/core';

import { askEventDocStoreProvide } from '../../eventDoc/context/askEventDocStoreProvide';
import { buildEventDocStore } from '../../eventDoc/context/buildEventDocStore';
import { reportConfigGlobal } from '../constants/reportConfigGlobal';
import { REPORT_MONTH_DOC_TYPE } from '../constants/reportMonthDocType';
import { reportStoreName } from '../constants/reportStoreName';
import { ReportReadResult } from '../models/ReportReadResult';
import { ReportsConfig } from '../models/ReportsConfig';
import { ReportViewDefinition } from '../models/ReportViewDefinition';
import { ReportReadOptions } from '../types/ReportReadOptions';
import { askReportMonthStatesRead } from './askReportMonthStatesRead';
import { buildReportReadResult } from './buildReportReadResult';
import { planReportRead } from './planReportRead';
import { readReportEventSettings } from './readReportEventSettings';
import { resolveReportView } from './resolveReportView';

/**
 * Answers a view (a declared name, or an ad hoc view) from any service that declares the report, in the reader's scope.
 * Reads the few month documents its period and comparison touch and adds up their cells; nothing is stored per view, so a
 * view over data collected before it existed answers straight away. A view it cannot read throws Invalid, naming why.
 */
export function* askReportRead(
  reportName: string,
  viewNameOrView: string | ReportViewDefinition,
  options?: ReportReadOptions,
): AskResponse<ReportReadResult> {
  const config = yield* askConfigGetGlobal<ReportsConfig>(reportConfigGlobal(reportName));
  const resolution = resolveReportView(config, viewNameOrView);

  if ('problem' in resolution) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, `askReportRead('${reportName}'): ${resolution.problem}`);
  }

  const { view } = resolution;
  const utcOffset = options?.utcOffset ?? config.utcOffset;
  const utcOffsetMinutes = getUtcOffsetMinutes(utcOffset);

  if (utcOffsetMinutes === null) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, `askReportRead('${reportName}'): '${utcOffset}' is not a UTC offset`);
  }

  const now = yield* askDateNow();
  const plan = planReportRead({
    view,
    now,
    utcOffsetMinutes,
    financialYearStartMonth: config.financialYearStartMonth,
    retentionMonths: readReportEventSettings(config, view.event)?.retentionMonths,
  });

  if ('problem' in plan) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, `askReportRead('${reportName}'): ${plan.problem}`);
  }

  const months = [...new Set([...plan.periodMonths, ...(plan.comparison?.months ?? [])])];
  const store = buildEventDocStore({ storeName: reportStoreName(reportName), type: REPORT_MONTH_DOC_TYPE });
  const states = yield* askEventDocStoreProvide(store, askReportMonthStatesRead(view.event, months));

  return buildReportReadResult({ view, now, utcOffset, utcOffsetMinutes, plan, states });
}
