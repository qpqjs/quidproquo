import { describe, expect, it } from 'vitest';

import { toEventDocAiClientUsage } from './toEventDocAiClientUsage';

describe('toEventDocAiClientUsage', () => {
  it('keeps the tokens, takes out what the call cost the platform and adds the charge', () => {
    expect(toEventDocAiClientUsage({ inputTokens: 120, outputTokens: 4, costMicroUsd: 900 }, 1_800)).toEqual({
      inputTokens: 120,
      outputTokens: 4,
      chargeMicroUsd: 1_800,
    });
  });

  it('adds no charge when the chat bills nothing', () => {
    expect(toEventDocAiClientUsage({ inputTokens: 120, costMicroUsd: 900 }, null)).toEqual({ inputTokens: 120 });
  });
});
