import type { AiModelTokenRates, AiTokenRates } from '@qpqjs/core';

/** Where a chat counts its model calls, and the per-token rates the client is charged at. */
export type EventDocAiUsageReport = {
  reportName: string;
  // US dollars per million tokens, per model.
  chargeRates: AiModelTokenRates;
  // What a model missing from `chargeRates` is charged at, so a forgotten model is never free.
  defaultChargeRates: AiTokenRates;
};
