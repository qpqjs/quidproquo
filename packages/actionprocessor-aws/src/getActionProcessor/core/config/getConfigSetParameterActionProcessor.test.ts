import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { askConfigSetParameter, buildTestQpqConfig, ConfigActionType, defineParameter } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setParameter } from '../../../logic/parametersManager/setParameter';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getConfigSetParameterActionProcessor } from './getConfigSetParameterActionProcessor';

vi.mock('../../../logic/parametersManager/setParameter', () => ({
  setParameter: vi.fn(),
}));

const buildConfig = () => buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineParameter('flag')]);

const resolveProcessor = async () => {
  const processors = await getConfigSetParameterActionProcessor(buildConfig(), {} as any);
  return processors[ConfigActionType.SetParameter];
};

describe('getConfigSetParameterActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(setParameter).mockReset();
  });

  it('writes the parameter under its resolved runtime key', async () => {
    vi.mocked(setParameter).mockResolvedValue(undefined as any);
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { parameterName: 'flag', parameterValue: 'on' });

    expect(result).toEqual([undefined]);
    expect(setParameter).toHaveBeenCalledWith('flag-test-app-test-module-development', 'eu-west-1', 'on');
  });

  it.each([
    ['ThrottlingException', askConfigSetParameter.errorType.Throttling],
    ['ParameterLimitExceeded', askConfigSetParameter.errorType.QuotaExceeded],
  ])('maps %s to the matching error type', async (errorName: string, expectedType: string) => {
    vi.mocked(setParameter).mockRejectedValue(Object.assign(new Error('boom'), { name: errorName }));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { parameterName: 'flag', parameterValue: 'on' });

    expect(error?.errorType).toBe(expectedType);
  });
});
