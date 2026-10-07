import { AiCacheTtl, AiModel } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { toBedrockCachePoint } from './toBedrockCachePoint';

describe('toBedrockCachePoint', () => {
  it('sends the ttl for an hour on a model that can cache that long', () => {
    expect(toBedrockCachePoint({ model: AiModel.ClaudeSonnet46, cacheTtl: AiCacheTtl.OneHour })).toEqual({ type: 'default', ttl: '1h' });
    expect(toBedrockCachePoint({ model: AiModel.ClaudeHaiku45, cacheTtl: AiCacheTtl.OneHour })).toEqual({ type: 'default', ttl: '1h' });
  });

  it('falls back to the default lifetime for an hour on a model that would reject the field', () => {
    for (const model of [AiModel.ClaudeSonnet35, AiModel.ClaudeHaiku35, AiModel.ClaudeSonnet4, AiModel.ClaudeOpus4]) {
      expect(toBedrockCachePoint({ model, cacheTtl: AiCacheTtl.OneHour })).toEqual({ type: 'default' });
    }
  });

  it('omits the ttl key for five minutes, the provider default, and no request at all', () => {
    for (const cacheTtl of [AiCacheTtl.FiveMinutes, AiCacheTtl.ProviderDefault, undefined]) {
      expect(toBedrockCachePoint({ model: AiModel.ClaudeSonnet46, cacheTtl })).toEqual({ type: 'default' });
      expect(toBedrockCachePoint({ model: AiModel.ClaudeSonnet46, cacheTtl })).not.toHaveProperty('ttl');
    }
  });
});
