import { AiDataRegion, AiModel } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { bedrockModelMap } from './aiModelMap';

// The inference profile prefix says where Bedrock runs the request, so an id has to sit under
// the region its prefix names.
const profilePrefixByRegion: Record<AiDataRegion, string> = {
  [AiDataRegion.Australia]: 'au.',
  [AiDataRegion.Global]: 'global.',
};

describe('bedrockModelMap', () => {
  it.each(Object.values(AiModel))('offers %s in at least one region', (model: AiModel) => {
    expect(Object.keys(bedrockModelMap[model]).length).toBeGreaterThan(0);
  });

  it('covers every AiModel enum member', () => {
    expect(Object.keys(bedrockModelMap).sort()).toEqual(Object.values(AiModel).sort());
  });

  it.each(Object.values(AiModel))('files every id of %s under the region its profile prefix runs in', (model: AiModel) => {
    for (const [region, modelId] of Object.entries(bedrockModelMap[model])) {
      expect(modelId, `${model} in ${region}`).toMatch(new RegExp(`^${profilePrefixByRegion[region as AiDataRegion].replace('.', '\\.')}`));
    }
  });

  it('maps ClaudeHaiku35 to its Australian anthropic bedrock id', () => {
    expect(bedrockModelMap[AiModel.ClaudeHaiku35][AiDataRegion.Australia]).toBe('au.anthropic.claude-3-5-haiku-20241022-v1:0');
  });

  it('offers the Global-only models through their global. profile and nowhere else', () => {
    expect(bedrockModelMap[AiModel.ClaudeSonnet55]).toEqual({ [AiDataRegion.Global]: 'global.anthropic.claude-sonnet-5-5' });
    expect(bedrockModelMap[AiModel.ClaudeFable51]).toEqual({ [AiDataRegion.Global]: 'global.anthropic.claude-fable-5-1' });
  });

  it('maps ClaudeOpus55 to its au. inference profile and nowhere else', () => {
    expect(bedrockModelMap[AiModel.ClaudeOpus55]).toEqual({ [AiDataRegion.Australia]: 'au.anthropic.claude-opus-5-5' });
  });
});
