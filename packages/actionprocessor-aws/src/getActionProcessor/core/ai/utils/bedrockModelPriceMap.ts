import { AiDataRegion, AiModel } from '@qpqjs/core';

import { BedrockModelPrices } from '../types';

/**
 * Bedrock's on-demand list price for each model, under the profile `bedrockModelMap` runs it in, in
 * US dollars per million tokens. Read on 10 Nov 2026 from the Amazon Bedrock pricing page and the
 * AWS Price List for ap-southeast-2 and ap-southeast-4 (published 9 Nov 2026), which agree, and
 * which give Sydney and Melbourne the same price. An `au.` profile is the global price plus 10%.
 *
 * The models with no price have no `au.` profile on Bedrock to price (3.5 Haiku, 3.5 Sonnet, Opus 4,
 * Sonnet 4 and Opus 4.5), so a call to one of them is left unpriced.
 */
export const bedrockModelPriceMap: Record<AiModel, BedrockModelPrices> = {
  [AiModel.ClaudeHaiku35]: {},
  [AiModel.ClaudeSonnet35]: {},
  [AiModel.ClaudeSonnet4]: {},
  [AiModel.ClaudeOpus4]: {},
  [AiModel.ClaudeHaiku45]: {
    [AiDataRegion.Australia]: { input: 1.1, output: 5.5, cacheRead: 0.11, cacheWriteFiveMinutes: 1.375, cacheWriteOneHour: 2.2 },
  },
  [AiModel.ClaudeSonnet45]: {
    [AiDataRegion.Australia]: { input: 3.3, output: 16.5, cacheRead: 0.33, cacheWriteFiveMinutes: 4.125, cacheWriteOneHour: 6.6 },
  },
  [AiModel.ClaudeOpus45]: {},
  [AiModel.ClaudeSonnet46]: {
    [AiDataRegion.Australia]: { input: 3.3, output: 16.5, cacheRead: 0.33, cacheWriteFiveMinutes: 4.125, cacheWriteOneHour: 6.6 },
  },
  [AiModel.ClaudeOpus46]: {
    [AiDataRegion.Australia]: { input: 5.5, output: 27.5, cacheRead: 0.55, cacheWriteFiveMinutes: 6.875, cacheWriteOneHour: 11 },
  },
  [AiModel.ClaudeOpus47]: {
    [AiDataRegion.Australia]: { input: 5.5, output: 27.5, cacheRead: 0.55, cacheWriteFiveMinutes: 6.875, cacheWriteOneHour: 11 },
  },
  [AiModel.ClaudeOpus48]: {
    [AiDataRegion.Australia]: { input: 5.5, output: 27.5, cacheRead: 0.55, cacheWriteFiveMinutes: 6.875, cacheWriteOneHour: 11 },
  },
  [AiModel.ClaudeSonnet5]: {
    [AiDataRegion.Australia]: { input: 2.2, output: 11, cacheRead: 0.22, cacheWriteFiveMinutes: 2.75, cacheWriteOneHour: 4.4 },
  },
  [AiModel.ClaudeOpus5]: {
    [AiDataRegion.Australia]: { input: 5.5, output: 27.5, cacheRead: 0.55, cacheWriteFiveMinutes: 6.875, cacheWriteOneHour: 11 },
  },
  [AiModel.ClaudeOpus55]: {
    [AiDataRegion.Australia]: { input: 4.4, output: 22, cacheRead: 0.22, cacheWriteFiveMinutes: 5.5, cacheWriteOneHour: 8.8 },
  },
  [AiModel.ClaudeSonnet55]: {
    [AiDataRegion.Global]: { input: 2, output: 10, cacheRead: 0.1, cacheWriteFiveMinutes: 2.5, cacheWriteOneHour: 4 },
  },
  [AiModel.ClaudeFable5]: {
    [AiDataRegion.Global]: { input: 10, output: 50, cacheRead: 1, cacheWriteFiveMinutes: 12.5, cacheWriteOneHour: 20 },
  },
  [AiModel.ClaudeFable51]: {
    [AiDataRegion.Global]: { input: 10, output: 50, cacheRead: 0.25, cacheWriteFiveMinutes: 12.5, cacheWriteOneHour: 20 },
  },
};
