import { askCatch, askLogCreate, AskResponse, LogLevelEnum } from '@qpqjs/core';

import { askReportAppend } from '../../reports/logic/askReportAppend';
import { AI_USAGE_REPORT_EVENT } from '../constants/aiUsageReportEvent';
import type { AiUsageReportInput } from '../types/AiUsageReportInput';
import { buildAiUsageReportMeasures } from './buildAiUsageReportMeasures';
import { getAiUsageChargeMicroUsd } from './getAiUsageChargeMicroUsd';

/**
 * Counts one model call in a report, under the caller's scope: its tokens, what it cost (when the
 * platform priced it) and what it is charged at `chargeRates`, or at `defaultChargeRates` with a
 * warning for a model missing from them. Never throws: a failed count is logged, so it can't break
 * the AI reply.
 */
export function* askAiUsageReport(
  reportName: string,
  { model, source, usage, chargeRates, defaultChargeRates, cacheTtl }: AiUsageReportInput,
): AskResponse<void> {
  if (!chargeRates[model]) {
    yield* askLogCreate(
      LogLevelEnum.Warn,
      `[aiUsage] ${reportName}: no charge rate for ${model}, so its call from ${source} is charged at the default rate`,
    );
  }

  const measures = buildAiUsageReportMeasures(usage, getAiUsageChargeMicroUsd({ usage, model, chargeRates, defaultChargeRates, cacheTtl }));
  const appended = yield* askCatch(askReportAppend(reportName, { type: AI_USAGE_REPORT_EVENT, dimensions: { model, source }, measures }));

  if (!appended.success) {
    yield* askLogCreate(
      LogLevelEnum.Error,
      `[aiUsage] ${reportName}: a call to ${model} from ${source} was not counted: ${appended.error.errorText}`,
    );
  }
}
