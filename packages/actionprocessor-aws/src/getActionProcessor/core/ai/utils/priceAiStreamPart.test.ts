import { AiDataRegion, AiModel, AiStreamFinishReasonEnum, type AiStreamPart, AiStreamPartType } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { priceAiStreamPart } from './priceAiStreamPart';
import { priceBedrockUsage } from './priceBedrockUsage';

const call = { model: AiModel.ClaudeSonnet46, region: AiDataRegion.Australia };
const usage = { noCacheInputTokens: 1_000, outputTokens: 100 };

describe('priceAiStreamPart', () => {
  it('prices the usage on the finish of the call and of each step', () => {
    const priced = priceBedrockUsage(usage, call);

    expect(priced.costMicroUsd).toBeGreaterThan(0);
    expect(priceAiStreamPart({ type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.stop, usage }, call)).toEqual({
      type: AiStreamPartType.Finish,
      finishReason: AiStreamFinishReasonEnum.stop,
      usage: priced,
    });
    expect(priceAiStreamPart({ type: AiStreamPartType.FinishStep, finishReason: AiStreamFinishReasonEnum.toolCalls, usage }, call)).toEqual({
      type: AiStreamPartType.FinishStep,
      finishReason: AiStreamFinishReasonEnum.toolCalls,
      usage: priced,
    });
  });

  it('passes every other part through untouched', () => {
    const part: AiStreamPart = { type: AiStreamPartType.TextDelta, id: 't', text: 'hi' };

    expect(priceAiStreamPart(part, call)).toBe(part);
  });
});
