import { AiModel, buildTestQpqConfig, defineAi, ErrorTypeEnum } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { prepareAiPromptCall } from './prepareAiPromptCall';

const bedrockFactory = vi.fn((modelId: string) => ({ __model: modelId }));
const createAmazonBedrock = vi.fn(() => bedrockFactory);

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));

vi.mock('@ai-sdk/amazon-bedrock', () => ({
  createAmazonBedrock: (opts: unknown) => createAmazonBedrock(opts),
}));

vi.mock('ai', () => ({
  jsonSchema: (schema: unknown) => ({ __jsonSchema: schema }),
}));

vi.mock('../../../../awsLambdaUtils', () => ({ randomGuid: () => 'guid' }));

const collaborators = [{} as never, {}, {} as never, {} as never, {} as never] as const;

describe('prepareAiPromptCall', () => {
  it('creates the bedrock provider for the deploy region', () => {
    const config = buildTestQpqConfig();

    prepareAiPromptCall(config, { model: AiModel.ClaudeHaiku35 }, ...collaborators);

    expect(createAmazonBedrock).toHaveBeenCalledWith({ region: 'us-test-1' });
  });

  it('returns the resolved model and no tools when aiName is omitted', () => {
    const config = buildTestQpqConfig();

    const result = prepareAiPromptCall(config, { model: AiModel.ClaudeSonnet45 }, ...collaborators);

    expect(result).toEqual({ model: { __model: 'au.anthropic.claude-sonnet-4-5-20250929-v1:0' }, tools: undefined });
  });

  it('errors with NotImplemented for an unsupported model', () => {
    const config = buildTestQpqConfig();

    const result = prepareAiPromptCall(config, { model: 'nope' as AiModel }, ...collaborators);

    expect(result).toEqual({ error: { type: ErrorTypeEnum.NotImplemented, message: 'Unsupported AI model: nope' } });
  });

  it('errors with NotFound when the named ai config is missing', () => {
    const config = buildTestQpqConfig();

    const result = prepareAiPromptCall(config, { model: AiModel.ClaudeHaiku35, aiName: 'missing' }, ...collaborators);

    expect(result).toEqual({ error: { type: ErrorTypeEnum.NotFound, message: 'AI config not found: missing' } });
  });

  it('builds tools from the named ai config', () => {
    const config = buildTestQpqConfig([
      defineAi('myAi', {
        tools: [{ name: 'lookup', description: 'looks up', executor: 'mod#fn', inputSchema: { type: 'object' } }],
      }),
    ]);

    const result = prepareAiPromptCall(config, { model: AiModel.ClaudeHaiku35, aiName: 'myAi' }, ...collaborators);

    if ('error' in result) {
      throw new Error('expected a successful prepare result');
    }

    expect(result.tools?.lookup.description).toBe('looks up');
    expect(result.tools?.lookup.inputSchema).toEqual({ __jsonSchema: { type: 'object' } });
    expect(typeof result.tools?.lookup.execute).toBe('function');
  });
});
