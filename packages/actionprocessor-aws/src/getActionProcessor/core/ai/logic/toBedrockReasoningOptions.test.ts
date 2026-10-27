import { AiModel, AiReasoningEffort } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { toBedrockReasoningOptions } from './toBedrockReasoningOptions';

describe('toBedrockReasoningOptions', () => {
  it('sends nothing when reasoning is not requested', () => {
    expect(toBedrockReasoningOptions(AiModel.ClaudeOpus55)).toBeUndefined();
    expect(toBedrockReasoningOptions(AiModel.ClaudeSonnet46, undefined)).toBeUndefined();
  });

  it('turns the effort into a token budget on a model that still takes one', () => {
    expect(toBedrockReasoningOptions(AiModel.ClaudeSonnet46, { effort: AiReasoningEffort.Medium })).toEqual({
      bedrock: { reasoningConfig: { type: 'enabled', budgetTokens: 4096 } },
    });
    expect(toBedrockReasoningOptions(AiModel.ClaudeHaiku45, { effort: AiReasoningEffort.Low })).toEqual({
      bedrock: { reasoningConfig: { type: 'enabled', budgetTokens: 1024 } },
    });
    expect(toBedrockReasoningOptions(AiModel.ClaudeOpus46, { effort: AiReasoningEffort.Max })).toEqual({
      bedrock: { reasoningConfig: { type: 'enabled', budgetTokens: 32768 } },
    });
  });

  it('sends adaptive thinking with a summary at the effort on a model that rejects a budget', () => {
    for (const model of [
      AiModel.ClaudeOpus47,
      AiModel.ClaudeOpus48,
      AiModel.ClaudeSonnet5,
      AiModel.ClaudeOpus5,
      AiModel.ClaudeOpus55,
      AiModel.ClaudeFable51,
    ]) {
      expect(toBedrockReasoningOptions(model, { effort: AiReasoningEffort.High })).toEqual({
        bedrock: { reasoningConfig: { type: 'adaptive', display: 'summarized', maxReasoningEffort: 'high' } },
      });
    }
  });
});
