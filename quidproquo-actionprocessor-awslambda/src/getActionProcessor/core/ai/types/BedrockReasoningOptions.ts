import { AiReasoningEffort } from 'quidproquo-core';

/** The `providerOptions` that turn extended thinking on for a Bedrock call. */
export type BedrockReasoningOptions = {
  bedrock: {
    reasoningConfig: { type: 'enabled'; budgetTokens: number } | { type: 'adaptive'; display: 'summarized'; maxReasoningEffort?: AiReasoningEffort };
  };
};
