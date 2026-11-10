import { AiCacheTtl, AiModel } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { getAiUsageChargeMicroUsd } from './getAiUsageChargeMicroUsd';

const chargeRates = { [AiModel.ClaudeSonnet46]: { input: 6, output: 30, cacheRead: 0.6, cacheWriteFiveMinutes: 7.5, cacheWriteOneHour: 12 } };
const defaultChargeRates = { input: 20, output: 100, cacheRead: 2, cacheWriteFiveMinutes: 25, cacheWriteOneHour: 40 };
const usage = { noCacheInputTokens: 100, cacheWriteInputTokens: 100, outputTokens: 10 };

describe('getAiUsageChargeMicroUsd', () => {
  it("charges a call at its model's rates", () => {
    expect(getAiUsageChargeMicroUsd({ usage, model: AiModel.ClaudeSonnet46, chargeRates, defaultChargeRates })).toBe(600 + 1_200 + 300);
  });

  it('charges a model missing from the rates at the default', () => {
    expect(getAiUsageChargeMicroUsd({ usage, model: AiModel.ClaudeOpus55, chargeRates, defaultChargeRates })).toBe(2_000 + 4_000 + 1_000);
  });

  it('charges cache writes at the five minute rate when the call only cached for five minutes', () => {
    expect(
      getAiUsageChargeMicroUsd({ usage, model: AiModel.ClaudeSonnet46, chargeRates, defaultChargeRates, cacheTtl: AiCacheTtl.FiveMinutes }),
    ).toBe(600 + 750 + 300);
  });
});
