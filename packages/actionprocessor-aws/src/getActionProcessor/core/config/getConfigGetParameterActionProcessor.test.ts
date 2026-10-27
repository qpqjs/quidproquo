import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { askConfigGetParameter, buildTestQpqConfig, ConfigActionType, defineParameter } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getParameter } from '../../../logic/parametersManager/getParameter';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getConfigGetParameterActionProcessor } from './getConfigGetParameterActionProcessor';

vi.mock('../../../logic/parametersManager/getParameter', () => ({
  getParameter: vi.fn(),
}));

const buildConfig = () => buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineParameter('flag')]);

const resolveProcessor = async () => {
  const processors = await getConfigGetParameterActionProcessor(buildConfig(), {} as any);
  return processors[ConfigActionType.GetParameter];
};

describe('getConfigGetParameterActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getParameter).mockReset();
  });

  it('resolves the runtime parameter key and returns the parameter value', async () => {
    vi.mocked(getParameter).mockResolvedValue('value');
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { parameterName: 'flag' });

    expect(result).toEqual(['value']);
    expect(getParameter).toHaveBeenCalledWith('flag-test-app-test-module-development', 'eu-west-1');
  });

  it('maps a throttling error to the throttling error type', async () => {
    vi.mocked(getParameter).mockRejectedValue(Object.assign(new Error('rate'), { name: 'ThrottlingException' }));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { parameterName: 'flag' });

    expect(error?.errorType).toBe(askConfigGetParameter.errorType.Throttling);
  });
});
