import { AiModel } from 'quidproquo-core';

// Models that take extended thinking as `thinking: { type: 'enabled', budget_tokens }`. Opus 4.7
// and newer and Sonnet 5 reject `budget_tokens` and run adaptive thinking instead, so any model
// not listed here gets the adaptive form. The 4.6 pair still accepts a budget and stays here so
// the default event-doc chat path behaves as it did.
export const bedrockBudgetThinkingModels: ReadonlySet<AiModel> = new Set([
  AiModel.ClaudeHaiku35,
  AiModel.ClaudeSonnet35,
  AiModel.ClaudeSonnet4,
  AiModel.ClaudeOpus4,
  AiModel.ClaudeHaiku45,
  AiModel.ClaudeSonnet45,
  AiModel.ClaudeOpus45,
  AiModel.ClaudeSonnet46,
  AiModel.ClaudeOpus46,
]);
