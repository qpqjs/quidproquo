import { AiModel, AiReasoningConfig } from 'quidproquo-core';

import { bedrockBudgetThinkingModels } from '../bedrockBudgetThinkingModels';
import { BedrockReasoningOptions } from '../types';

const DEFAULT_BUDGET_TOKENS = 4096;

/**
 * The provider options that turn extended thinking on for a model, or nothing when the caller
 * asked for none. Budget models get the token budget; the rest run adaptive thinking with the
 * requested effort. Adaptive models omit the thinking text unless asked, and the event-doc chat
 * shows it as progress, so a summary is always requested.
 */
export const toBedrockReasoningOptions = (model: AiModel, reasoning?: AiReasoningConfig): BedrockReasoningOptions | undefined => {
  if (!reasoning) {
    return undefined;
  }

  if (bedrockBudgetThinkingModels.has(model)) {
    return { bedrock: { reasoningConfig: { type: 'enabled', budgetTokens: reasoning.budgetTokens ?? DEFAULT_BUDGET_TOKENS } } };
  }

  return {
    bedrock: {
      reasoningConfig: {
        type: 'adaptive',
        display: 'summarized',
        ...(reasoning.effort ? { maxReasoningEffort: reasoning.effort } : {}),
      },
    },
  };
};
