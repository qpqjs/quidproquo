import { AiModel } from 'quidproquo-core';

// Models whose Bedrock cache checkpoints accept `ttl: '1h'`, per the Bedrock prompt caching
// model table. The rest reject the field, so an hour request falls back to the default lifetime.
export const bedrockOneHourCacheModels: ReadonlySet<AiModel> = new Set([
  AiModel.ClaudeHaiku45,
  AiModel.ClaudeSonnet45,
  AiModel.ClaudeOpus45,
  AiModel.ClaudeSonnet46,
  AiModel.ClaudeOpus46,
  AiModel.ClaudeOpus47,
  AiModel.ClaudeOpus48,
  AiModel.ClaudeSonnet5,
  AiModel.ClaudeOpus5,
  AiModel.ClaudeOpus55,
]);
