import { AiDataRegion, AiModel } from 'quidproquo-core';

import { BedrockModelRegions } from './types';

// Each region's id is the cross-region inference profile that keeps the request in that region.
// Only Australia is populated: a `global.` profile would be a Global entry, never an Australian one.
export const bedrockModelMap: Record<AiModel, BedrockModelRegions> = {
  [AiModel.ClaudeHaiku35]: { [AiDataRegion.Australia]: 'au.anthropic.claude-3-5-haiku-20241022-v1:0' },
  [AiModel.ClaudeSonnet35]: { [AiDataRegion.Australia]: 'au.anthropic.claude-3-5-sonnet-20241022-v2:0' },
  [AiModel.ClaudeSonnet4]: { [AiDataRegion.Australia]: 'au.anthropic.claude-sonnet-4-20250514-v1:0' },
  [AiModel.ClaudeOpus4]: { [AiDataRegion.Australia]: 'au.anthropic.claude-opus-4-20250514-v1:0' },
  [AiModel.ClaudeHaiku45]: { [AiDataRegion.Australia]: 'au.anthropic.claude-haiku-4-5-20251001-v1:0' },
  [AiModel.ClaudeSonnet45]: { [AiDataRegion.Australia]: 'au.anthropic.claude-sonnet-4-5-20250929-v1:0' },
  [AiModel.ClaudeOpus45]: { [AiDataRegion.Australia]: 'au.anthropic.claude-opus-4-5-20251101-v1:0' },
  [AiModel.ClaudeSonnet46]: { [AiDataRegion.Australia]: 'au.anthropic.claude-sonnet-4-6' },
  [AiModel.ClaudeOpus46]: { [AiDataRegion.Australia]: 'au.anthropic.claude-opus-4-6-v1' },
  [AiModel.ClaudeOpus47]: { [AiDataRegion.Australia]: 'au.anthropic.claude-opus-4-7' },
  [AiModel.ClaudeOpus48]: { [AiDataRegion.Australia]: 'au.anthropic.claude-opus-4-8' },
  [AiModel.ClaudeSonnet5]: { [AiDataRegion.Australia]: 'au.anthropic.claude-sonnet-5' },
  [AiModel.ClaudeOpus5]: { [AiDataRegion.Australia]: 'au.anthropic.claude-opus-5' },
  [AiModel.ClaudeOpus55]: { [AiDataRegion.Australia]: 'au.anthropic.claude-opus-5-5' },
};
