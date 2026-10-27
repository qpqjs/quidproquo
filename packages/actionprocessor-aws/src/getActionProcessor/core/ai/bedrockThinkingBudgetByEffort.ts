import { AiReasoningEffort } from 'quidproquo-core';

// The thinking token budget an effort level means on a model that takes `budget_tokens` instead
// of an effort. Anthropic's floor is 1,024; Medium is the long-standing default.
export const bedrockThinkingBudgetByEffort: Record<AiReasoningEffort, number> = {
  [AiReasoningEffort.Low]: 1024,
  [AiReasoningEffort.Medium]: 4096,
  [AiReasoningEffort.High]: 8192,
  [AiReasoningEffort.XHigh]: 16384,
  [AiReasoningEffort.Max]: 32768,
};
