import { type AiCacheTtl, type AiModel, type AiStreamPart, askConfigGetGlobal, AskResponse, type Nullable } from '@qpqjs/core';

import { askAiUsageReport } from '../../aiUsage/logic/askAiUsageReport';
import { EVENT_DOC_TYPE_GLOBAL } from '../../eventDoc';
import { EVENT_DOC_AI_CACHE_TTL_GLOBAL, EVENT_DOC_AI_USAGE_REPORT_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiUsageReport } from '../types/EventDocAiUsageReport';
import { getEventDocAiStreamUsage } from './getEventDocAiStreamUsage';

/**
 * Counts one execution's model call in the chat's usage report, with the chat's document type as
 * the source. Nothing when the chat has no usage report or the stream reported no usage.
 */
export function* askEventDocAiUsageReport(model: AiModel, assistantParts: AiStreamPart[]): AskResponse<void> {
  const usageReport = yield* askConfigGetGlobal<Nullable<EventDocAiUsageReport>>(EVENT_DOC_AI_USAGE_REPORT_GLOBAL);
  const usage = getEventDocAiStreamUsage(assistantParts);

  if (!usageReport || !usage) {
    return;
  }

  const source = yield* askConfigGetGlobal<string>(EVENT_DOC_TYPE_GLOBAL);
  const cacheTtl = yield* askConfigGetGlobal<AiCacheTtl>(EVENT_DOC_AI_CACHE_TTL_GLOBAL);

  yield* askAiUsageReport(usageReport.reportName, {
    model,
    source,
    usage,
    chargeRates: usageReport.chargeRates,
    defaultChargeRates: usageReport.defaultChargeRates,
    cacheTtl,
  });
}
