import { describe, expect, it } from 'vitest';

import { buildAiUsageReportMeasures } from './buildAiUsageReportMeasures';

describe('buildAiUsageReportMeasures', () => {
  it('counts every reported token kind, the cost and the charge', () => {
    expect(
      buildAiUsageReportMeasures(
        {
          inputTokens: 1_100,
          outputTokens: 50,
          totalTokens: 1_150,
          cacheReadInputTokens: 1_000,
          cacheWriteInputTokens: 0,
          noCacheInputTokens: 100,
          costMicroUsd: 1_350,
        },
        2_700,
      ),
    ).toEqual({
      inputTokens: 1_100,
      outputTokens: 50,
      cacheReadInputTokens: 1_000,
      cacheWriteInputTokens: 0,
      noCacheInputTokens: 100,
      costMicroUsd: 1_350,
      chargeMicroUsd: 2_700,
    });
  });

  it('leaves out what the provider did not report', () => {
    expect(buildAiUsageReportMeasures({ inputTokens: 10 }, 30)).toEqual({ inputTokens: 10, chargeMicroUsd: 30 });
  });
});
