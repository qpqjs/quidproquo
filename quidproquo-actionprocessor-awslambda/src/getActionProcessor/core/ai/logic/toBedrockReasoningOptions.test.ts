import { AiModel, AiReasoningEffort } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { toBedrockReasoningOptions } from './toBedrockReasoningOptions';

describe('toBedrockReasoningOptions', () => {
  it('sends nothing when reasoning is not requested', () => {
    expect(toBedrockReasoningOptions(AiModel.ClaudeOpus55)).toBeUndefined();
    expect(toBedrockReasoningOptions(AiModel.ClaudeSonnet46, undefined)).toBeUndefined();
  });

  it('sends a token budget on a model that still takes one, defaulting to 4096', () => {
    expect(toBedrockReasoningOptions(AiModel.ClaudeSonnet46, {})).toEqual({
      bedrock: { reasoningConfig: { type: 'enabled', budgetTokens: 4096 } },
    });
    expect(toBedrockReasoningOptions(AiModel.ClaudeHaiku45, { budgetTokens: 8192 })).toEqual({
      bedrock: { reasoningConfig: { type: 'enabled', budgetTokens: 8192 } },
    });
  });

  it('ignores effort on a budget model', () => {
    expect(toBedrockReasoningOptions(AiModel.ClaudeOpus46, { effort: AiReasoningEffort.Max })).toEqual({
      bedrock: { reasoningConfig: { type: 'enabled', budgetTokens: 4096 } },
    });
  });

  it('sends adaptive thinking with a summary on a model that rejects a budget', () => {
    for (const model of [AiModel.ClaudeOpus47, AiModel.ClaudeOpus48, AiModel.ClaudeSonnet5, AiModel.ClaudeOpus5, AiModel.ClaudeOpus55]) {
      expect(toBedrockReasoningOptions(model, { budgetTokens: 4096 })).toEqual({
        bedrock: { reasoningConfig: { type: 'adaptive', display: 'summarized' } },
      });
    }
  });

  it('passes effort through on an adaptive model', () => {
    expect(toBedrockReasoningOptions(AiModel.ClaudeOpus55, { effort: AiReasoningEffort.High })).toEqual({
      bedrock: { reasoningConfig: { type: 'adaptive', display: 'summarized', maxReasoningEffort: 'high' } },
    });
  });
});
