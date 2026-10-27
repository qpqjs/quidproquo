import {
  buildTestQpqConfig,
  ConfigActionType,
  ErrorTypeEnum,
  isErroredActionResult,
  noopDynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getConfigGetSecretActionProcessor } from './getConfigGetSecretActionProcessor';

const { configStore } = vi.hoisted(() => ({
  configStore: { getOrSeedSecretValue: vi.fn() },
}));

vi.mock('../../../logic/config', () => configStore);

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;

const getProcessor = async () => {
  const processors = await getConfigGetSecretActionProcessor(devServerConfig)(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[ConfigActionType.GetSecret];
};

describe('getConfigGetSecretActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the value from the store', async () => {
    configStore.getOrSeedSecretValue.mockResolvedValue('secret-guid');
    const process = await getProcessor();

    const result = await invokeProcessor(process, { secretName: 'apiKey' });

    expect(configStore.getOrSeedSecretValue).toHaveBeenCalledWith('/tmp/runtime', 'apiKey', expect.anything());
    expect(resolveActionResult(result)).toBe('secret-guid');
  });

  it('maps a store failure to a caught error', async () => {
    configStore.getOrSeedSecretValue.mockRejectedValue(new Error('boom'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { secretName: 'apiKey' });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
