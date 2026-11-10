import type { AiStreamUsage } from '@qpqjs/core';

import type { ReportMeasures } from '../../reports/models/ReportMeasures';

// The usage fields counted, cost included. `totalTokens` is left out: it only adds the others up.
const COUNTED_USAGE_FIELDS = [
  'inputTokens',
  'outputTokens',
  'cacheReadInputTokens',
  'cacheWriteInputTokens',
  'noCacheInputTokens',
  'costMicroUsd',
] as const;

/**
 * The measures one model call is counted with: each usage field the provider reported (a missing
 * one is left out, never counted as 0), and what the client is charged.
 */
export const buildAiUsageReportMeasures = (usage: AiStreamUsage, chargeMicroUsd: number): ReportMeasures => {
  const reported = COUNTED_USAGE_FIELDS.flatMap((field) => {
    const value = usage[field];
    return value === undefined ? [] : [[field, value] as const];
  });

  return {
    ...Object.fromEntries(reported),
    chargeMicroUsd,
  };
};
