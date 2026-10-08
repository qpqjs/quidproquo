import { AiDataRegion, AiModel } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { resolveBedrockModel } from './resolveBedrockModel';

vi.mock('../aiModelMap', () => ({
  bedrockModelMap: {
    [AiModel.ClaudeOpus55]: { [AiDataRegion.Global]: 'global.opus', [AiDataRegion.Australia]: 'au.opus' },
    [AiModel.ClaudeSonnet5]: { [AiDataRegion.Global]: 'global.sonnet' },
    [AiModel.ClaudeHaiku45]: { elsewhere: 'eu.haiku', another: 'us.haiku' },
    [AiModel.ClaudeSonnet4]: {},
  },
}));

describe('resolveBedrockModel', () => {
  it('prefers Australia when the model is offered there', () => {
    expect(resolveBedrockModel(AiModel.ClaudeOpus55)).toEqual({ modelId: 'au.opus', region: AiDataRegion.Australia });
  });

  it('falls back to Global when there is no Australian profile', () => {
    expect(resolveBedrockModel(AiModel.ClaudeSonnet5)).toEqual({ modelId: 'global.sonnet', region: AiDataRegion.Global });
  });

  it('takes the first listed region when none of the preferred ones are offered', () => {
    expect(resolveBedrockModel(AiModel.ClaudeHaiku45)).toEqual({ modelId: 'eu.haiku', region: 'elsewhere' });
  });

  it('returns null for a model offered nowhere or not in the map', () => {
    expect(resolveBedrockModel(AiModel.ClaudeSonnet4)).toBeNull();
    expect(resolveBedrockModel('nope' as AiModel)).toBeNull();
  });
});
