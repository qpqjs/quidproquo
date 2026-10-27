import { buildTestQpqConfig, ConfigActionType, defineParameter } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getConfigListParametersActionProcessor } from './getConfigListParametersActionProcessor';

const resolveProcessor = async (config = buildTestQpqConfig()) => {
  const processors = await getConfigListParametersActionProcessor(config, {} as any);
  return processors[ConfigActionType.ListParameters];
};

describe('getConfigListParametersActionProcessor', () => {
  it('returns the keys of the owned parameter configs', async () => {
    const processor = await resolveProcessor(buildTestQpqConfig([defineParameter('a'), defineParameter('b')]));

    const result = await invokeProcessor(processor, {});

    expect(result).toEqual([['a', 'b']]);
  });

  it('returns an empty list when no parameters are defined', async () => {
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, {});

    expect(result).toEqual([[]]);
  });
});
