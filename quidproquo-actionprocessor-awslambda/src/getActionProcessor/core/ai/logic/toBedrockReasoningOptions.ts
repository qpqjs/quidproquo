import { AiModel, AiReasoningConfig } from 'quidproquo-core';

import { bedrockBudgetThinkingModels } from '../bedrockBudgetThinkingModels';
import { bedrockThinkingBudgetByEffort } from '../bedrockThinkingBudgetByEffort';
import { BedrockReasoningOptions } from '../types';

/**
 * The provider options that turn extended thinking on for a model, or nothing when the caller
 * asked for none. Budget models get the token budget the effort maps to; the rest run adaptive
 * thinking at that effort. Adaptive models omit the thinking text unless asked, and the event-doc
 * chat shows it as progress, so a summary is always requested.
 */
export const toBedrockReasoningOptions = (model: AiModel, reasoning?: AiReasoningConfig): BedrockReasoningOptions | undefined => {
  if (!reasoning) {
    return undefined;
  }

  if (bedrockBudgetThinkingModels.has(model)) {
    return { bedrock: { reasoningConfig: { type: 'enabled', budgetTokens: bedrockThinkingBudgetByEffort[reasoning.effort] } } };
  }

  return { bedrock: { reasoningConfig: { type: 'adaptive', display: 'summarized', maxReasoningEffort: reasoning.effort } } };
};
