import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { askConfigGetSecret, buildTestQpqConfig, ConfigActionType, defineSecret } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSecret } from '../../../logic/secretsManager/getSecret';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getConfigGetSecretActionProcessor } from './getConfigGetSecretActionProcessor';

vi.mock('../../../logic/secretsManager/getSecret', () => ({
  getSecret: vi.fn(),
}));

const buildConfig = () => buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineSecret('apiKey')]);

const resolveProcessor = async () => {
  const processors = await getConfigGetSecretActionProcessor(buildConfig(), {} as any);
  return processors[ConfigActionType.GetSecret];
};

describe('getConfigGetSecretActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getSecret).mockReset();
  });

  it('resolves the runtime secret name and returns the secret value', async () => {
    vi.mocked(getSecret).mockResolvedValue('shhh');
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { secretName: 'apiKey' });

    expect(result).toEqual(['shhh']);
    expect(getSecret).toHaveBeenCalledWith('apiKey-test-app-test-module-development', 'eu-west-1');
  });

  it.each([
    ['ResourceNotFoundException', askConfigGetSecret.errorType.ResourceNotFound],
    ['ThrottlingException', askConfigGetSecret.errorType.Throttling],
  ])('maps %s to the matching error type', async (errorName: string, expectedType: string) => {
    vi.mocked(getSecret).mockRejectedValue(Object.assign(new Error('boom'), { name: errorName }));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { secretName: 'apiKey' });

    expect(error?.errorType).toBe(expectedType);
  });
});
