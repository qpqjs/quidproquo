import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { askConfigGetParameters, buildTestQpqConfig, ConfigActionType, defineParameter } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getParameters } from '../../../logic/parametersManager/getParameters';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getConfigGetParametersActionProcessor } from './getConfigGetParametersActionProcessor';

vi.mock('../../../logic/parametersManager/getParameters', () => ({
  getParameters: vi.fn(),
}));

const buildConfig = () => buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineParameter('a'), defineParameter('b')]);

const resolveProcessor = async () => {
  const processors = await getConfigGetParametersActionProcessor(buildConfig(), {} as any);
  return processors[ConfigActionType.GetParameters];
};

describe('getConfigGetParametersActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getParameters).mockReset();
  });

  it('resolves every parameter key and returns the values', async () => {
    vi.mocked(getParameters).mockResolvedValue(['x', 'y']);
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { parameterNames: ['a', 'b'] });

    expect(result).toEqual([['x', 'y']]);
    expect(getParameters).toHaveBeenCalledWith(['a-test-app-test-module-development', 'b-test-app-test-module-development'], 'eu-west-1');
  });

  it('maps a throttling error to the throttling error type', async () => {
    vi.mocked(getParameters).mockRejectedValue(Object.assign(new Error('rate'), { name: 'ThrottlingException' }));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { parameterNames: ['a'] });

    expect(error?.errorType).toBe(askConfigGetParameters.errorType.Throttling);
  });
});
