import { AiDataRegion, AiModel } from 'quidproquo-core';

import { BedrockModelRegions } from './types';

// Each region's id is the cross-region inference profile that runs the request in that region. A
// model with only a Global entry is processed wherever Bedrock chooses, so the resolver's preference
// order is what keeps the rest in Australia.
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
  [AiModel.ClaudeSonnet55]: { [AiDataRegion.Global]: 'global.anthropic.claude-sonnet-5-5' },
  [AiModel.ClaudeFable5]: { [AiDataRegion.Global]: 'global.anthropic.claude-fable-5' },
  [AiModel.ClaudeFable51]: { [AiDataRegion.Global]: 'global.anthropic.claude-fable-5-1' },
};
