import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askConfigGetParameter, ConfigActionType, defineParameter } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getParameter } from '../../../logic/parametersManager/getParameter';
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

  // Security regression: a story can only read parameters its config declares; an undeclared name never reaches SSM.
  it('refuses an undeclared parameter before touching SSM', async () => {
    const processor = await resolveProcessor();

    await expect(invokeProcessor(processor, { parameterName: '/aws/reference/secretsmanager/other-app-secret' })).rejects.toThrow('not found');
    expect(getParameter).not.toHaveBeenCalled();
  });
});
