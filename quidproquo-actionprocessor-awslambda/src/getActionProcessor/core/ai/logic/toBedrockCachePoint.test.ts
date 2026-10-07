import { AiCacheTtl, AiModel } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { BedrockCachePointRole } from '../types';
import { toBedrockCachePoint } from './toBedrockCachePoint';

const plain = { type: 'default' };
const hour = { type: 'default', ttl: '1h' };

describe('toBedrockCachePoint', () => {
  describe('dynamic lifetime, the default', () => {
    it('keeps the system prompt and the saved-history anchor for an hour on a model that can', () => {
      expect(toBedrockCachePoint({ model: AiModel.ClaudeSonnet46 }, BedrockCachePointRole.System)).toEqual(hour);
      expect(toBedrockCachePoint({ model: AiModel.ClaudeSonnet46, cacheTtl: AiCacheTtl.Dynamic }, BedrockCachePointRole.Anchor)).toEqual(hour);
    });

    it('keeps the tool-loop tail on the default lifetime', () => {
      expect(toBedrockCachePoint({ model: AiModel.ClaudeSonnet46 }, BedrockCachePointRole.Tail)).toEqual(plain);
      expect(toBedrockCachePoint({ model: AiModel.ClaudeSonnet46 }, BedrockCachePointRole.Tail)).not.toHaveProperty('ttl');
    });

    it('falls back to the default everywhere on a model that cannot cache for an hour', () => {
      expect(toBedrockCachePoint({ model: AiModel.ClaudeSonnet4 }, BedrockCachePointRole.System)).toEqual(plain);
      expect(toBedrockCachePoint({ model: AiModel.ClaudeSonnet4 }, BedrockCachePointRole.Anchor)).toEqual(plain);
    });
  });

  it('pins the hour on the system prompt and the anchor when asked, on a model that can cache that long', () => {
    expect(toBedrockCachePoint({ model: AiModel.ClaudeHaiku45, cacheTtl: AiCacheTtl.OneHour }, BedrockCachePointRole.System)).toEqual(hour);
    expect(toBedrockCachePoint({ model: AiModel.ClaudeHaiku45, cacheTtl: AiCacheTtl.OneHour }, BedrockCachePointRole.Anchor)).toEqual(hour);
  });

  it('never keeps the tail for an hour, whatever was asked for', () => {
    for (const cacheTtl of [AiCacheTtl.Dynamic, AiCacheTtl.OneHour, AiCacheTtl.FiveMinutes, AiCacheTtl.ProviderDefault]) {
      expect(toBedrockCachePoint({ model: AiModel.ClaudeSonnet46, cacheTtl }, BedrockCachePointRole.Tail)).toEqual(plain);
    }
  });

  it('falls back to the default lifetime for an hour on a model that would reject the field', () => {
    for (const model of [AiModel.ClaudeSonnet35, AiModel.ClaudeHaiku35, AiModel.ClaudeSonnet4, AiModel.ClaudeOpus4]) {
      expect(toBedrockCachePoint({ model, cacheTtl: AiCacheTtl.OneHour }, BedrockCachePointRole.Anchor)).toEqual(plain);
    }
  });

  it('omits the ttl key for five minutes and the provider default on every point', () => {
    for (const cacheTtl of [AiCacheTtl.FiveMinutes, AiCacheTtl.ProviderDefault]) {
      for (const role of Object.values(BedrockCachePointRole)) {
        expect(toBedrockCachePoint({ model: AiModel.ClaudeSonnet46, cacheTtl }, role)).toEqual(plain);
        expect(toBedrockCachePoint({ model: AiModel.ClaudeSonnet46, cacheTtl }, role)).not.toHaveProperty('ttl');
      }
    }
  });
});
