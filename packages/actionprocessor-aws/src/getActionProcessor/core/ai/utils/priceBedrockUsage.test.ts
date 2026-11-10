import { AiCacheTtl, AiDataRegion, AiModel } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { bedrockModelPriceMap } from './bedrockModelPriceMap';
import { priceBedrockUsage } from './priceBedrockUsage';

const usage = { inputTokens: 1_200, noCacheInputTokens: 100, cacheReadInputTokens: 1_000, cacheWriteInputTokens: 100, outputTokens: 10 };

describe('priceBedrockUsage', () => {
  it("adds what the call cost at the price of the model's region, with the hour write price when some points lived an hour", () => {
    const rates = bedrockModelPriceMap[AiModel.ClaudeSonnet46][AiDataRegion.Australia]!;

    expect(priceBedrockUsage(usage, { model: AiModel.ClaudeSonnet46, region: AiDataRegion.Australia, cacheTtl: AiCacheTtl.Dynamic })).toEqual({
      ...usage,
      costMicroUsd: Math.round(100 * rates.input + 1_000 * rates.cacheRead + 100 * rates.cacheWriteOneHour! + 10 * rates.output),
    });
  });

  it('uses the five minute write price when every point lived five minutes', () => {
    const rates = bedrockModelPriceMap[AiModel.ClaudeSonnet46][AiDataRegion.Australia]!;

    expect(
      priceBedrockUsage(
        { cacheWriteInputTokens: 1_000 },
        { model: AiModel.ClaudeSonnet46, region: AiDataRegion.Australia, cacheTtl: AiCacheTtl.FiveMinutes },
      ),
    ).toEqual({
      cacheWriteInputTokens: 1_000,
      costMicroUsd: Math.round(1_000 * rates.cacheWriteFiveMinutes),
    });
  });

  it('leaves the usage unpriced in a region the model has no price for', () => {
    expect(priceBedrockUsage(usage, { model: AiModel.ClaudeSonnet46, region: AiDataRegion.Global })).toBe(usage);
  });
});
