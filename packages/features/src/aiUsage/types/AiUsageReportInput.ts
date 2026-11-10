import type { AiCacheTtl, AiModel, AiModelTokenRates, AiStreamUsage, AiTokenRates } from '@qpqjs/core';

/** One model call to count: what ran, what asked for it, what it used, and the rates it is charged at. */
export type AiUsageReportInput = {
  model: AiModel;
  // A category for what asked for the call (a chat type, a feature), never an identifier.
  source: string;
  usage: AiStreamUsage;
  // What the app charges per token, in US dollars per million tokens.
  chargeRates: AiModelTokenRates;
  // What a model missing from `chargeRates` is charged at, so a forgotten model is never free.
  defaultChargeRates: AiTokenRates;
  // The cache lifetime the call asked for; it decides which cache write rate the charge uses.
  cacheTtl?: AiCacheTtl;
};
