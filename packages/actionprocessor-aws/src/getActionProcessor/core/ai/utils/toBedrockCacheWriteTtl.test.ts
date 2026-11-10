import { AiCacheTtl, AiModel } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { toBedrockCacheWriteTtl } from './toBedrockCacheWriteTtl';

describe('toBedrockCacheWriteTtl', () => {
  it.each([AiCacheTtl.Dynamic, AiCacheTtl.OneHour, undefined])(
    'prices %s writes on an hour-capable model at the hour, as some of its points live an hour',
    (cacheTtl?: AiCacheTtl) => {
      expect(toBedrockCacheWriteTtl(AiModel.ClaudeSonnet46, cacheTtl)).toBe(AiCacheTtl.OneHour);
    },
  );

  it.each([AiCacheTtl.FiveMinutes, AiCacheTtl.ProviderDefault])(
    'prices %s writes at five minutes, the only lifetime they get',
    (cacheTtl: AiCacheTtl) => {
      expect(toBedrockCacheWriteTtl(AiModel.ClaudeSonnet46, cacheTtl)).toBe(AiCacheTtl.FiveMinutes);
    },
  );

  it('prices every write of a model that cannot cache for an hour at five minutes', () => {
    expect(toBedrockCacheWriteTtl(AiModel.ClaudeSonnet4, AiCacheTtl.OneHour)).toBe(AiCacheTtl.FiveMinutes);
  });
});
