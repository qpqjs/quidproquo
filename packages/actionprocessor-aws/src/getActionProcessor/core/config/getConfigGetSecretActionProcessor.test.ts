import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askConfigGetSecret, ConfigActionType, defineSecret } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSecret } from '../../../logic/secretsManager/getSecret';
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
    ['ThrottlingException', askConfigGetSecret.errorType.Throttled],
  ])('maps %s to the matching error type', async (errorName: string, expectedType: string) => {
    vi.mocked(getSecret).mockRejectedValue(Object.assign(new Error('boom'), { name: errorName }));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { secretName: 'apiKey' });

    expect(error?.errorType).toBe(expectedType);
  });

  // Security regression: a story can only read secrets its config declares; an undeclared name never reaches Secrets
  // Manager, and an error never carries a secret value.
  it('refuses an undeclared secret before touching Secrets Manager', async () => {
    const processor = await resolveProcessor();

    await expect(invokeProcessor(processor, { secretName: 'other-app/prod/db' })).rejects.toThrow('Can not find secret');
    expect(getSecret).not.toHaveBeenCalled();
  });
});
