import { AiDataRegion, AiModel } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { bedrockModelMap } from './aiModelMap';
import { bedrockModelPriceMap } from './bedrockModelPriceMap';
import { bedrockOneHourCacheModels } from './bedrockOneHourCacheModels';

// Listed in the model map but with no `au.` profile on Bedrock to price.
const UNPRICED = new Set([AiModel.ClaudeHaiku35, AiModel.ClaudeSonnet35, AiModel.ClaudeSonnet4, AiModel.ClaudeOpus4, AiModel.ClaudeOpus45]);

const priced = Object.values(AiModel).filter((model) => !UNPRICED.has(model));

describe('bedrockModelPriceMap', () => {
  it('covers every AiModel enum member', () => {
    expect(Object.keys(bedrockModelPriceMap).sort()).toEqual(Object.values(AiModel).sort());
  });

  it.each(priced)('prices %s in exactly the regions it is offered in', (model: AiModel) => {
    expect(Object.keys(bedrockModelPriceMap[model]).sort()).toEqual(Object.keys(bedrockModelMap[model]).sort());
  });

  it.each([...UNPRICED])('leaves %s unpriced', (model: AiModel) => {
    expect(bedrockModelPriceMap[model]).toEqual({});
  });

  it.each(priced)('gives %s an hour cache write price exactly when it can cache for an hour', (model: AiModel) => {
    for (const rates of Object.values(bedrockModelPriceMap[model])) {
      expect(rates!.cacheWriteOneHour !== undefined).toBe(bedrockOneHourCacheModels.has(model));
    }
  });

  it.each(priced)('prices %s with the Anthropic ratios: a five minute write at 1.25x input, an hour at 2x', (model: AiModel) => {
    for (const rates of Object.values(bedrockModelPriceMap[model])) {
      expect(rates!.cacheWriteFiveMinutes).toBeCloseTo(rates!.input * 1.25);
      expect(rates!.cacheWriteOneHour).toBeCloseTo(rates!.input * 2);
    }
  });

  it('prices Sonnet 4.6 at its Australian profile price', () => {
    expect(bedrockModelPriceMap[AiModel.ClaudeSonnet46][AiDataRegion.Australia]).toEqual({
      input: 3.3,
      output: 16.5,
      cacheRead: 0.33,
      cacheWriteFiveMinutes: 4.125,
      cacheWriteOneHour: 6.6,
    });
  });
});
