import { type AiCacheTtl, type AiModel, type AiStreamPart, type AiStreamUsage, askConfigGetGlobal, AskResponse, type Nullable } from '@qpqjs/core';

import { getAiUsageChargeMicroUsd } from '../../aiUsage/logic/getAiUsageChargeMicroUsd';
import { EVENT_DOC_AI_CACHE_TTL_GLOBAL, EVENT_DOC_AI_USAGE_REPORT_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiUsageReport } from '../types/EventDocAiUsageReport';
import { getEventDocAiStreamUsage } from './getEventDocAiStreamUsage';
import { toEventDocAiClientUsage } from './toEventDocAiClientUsage';

/**
 * The usage a reply is saved and shown with: its tokens and, when the chat has a usage report, what
 * it is charged at, never what it cost the platform. Null when the stream reported no usage.
 */
export function* askEventDocAiReplyUsage(model: AiModel, assistantParts: AiStreamPart[]): AskResponse<Nullable<AiStreamUsage>> {
  const usage = getEventDocAiStreamUsage(assistantParts);

  if (!usage) {
    return null;
  }

  const usageReport = yield* askConfigGetGlobal<Nullable<EventDocAiUsageReport>>(EVENT_DOC_AI_USAGE_REPORT_GLOBAL);

  if (!usageReport) {
    return toEventDocAiClientUsage(usage, null);
  }

  const cacheTtl = yield* askConfigGetGlobal<AiCacheTtl>(EVENT_DOC_AI_CACHE_TTL_GLOBAL);

  return toEventDocAiClientUsage(
    usage,
    getAiUsageChargeMicroUsd({ usage, model, chargeRates: usageReport.chargeRates, defaultChargeRates: usageReport.defaultChargeRates, cacheTtl }),
  );
}
