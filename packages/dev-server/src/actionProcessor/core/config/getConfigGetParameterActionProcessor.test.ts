import { ConfigActionType, ErrorTypeEnum, isErroredActionResult, resolveActionResult, resolveActionResultError } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getConfigGetParameterActionProcessor } from './getConfigGetParameterActionProcessor';

const { configStore } = vi.hoisted(() => ({
  configStore: { getOrSeedParameterValue: vi.fn() },
}));

vi.mock('../../../logic/config', () => configStore);

const devServerConfig = buildTestDevServerConfig();

const getProcessor = async () => {
  const processors = await getConfigGetParameterActionProcessor(devServerConfig)(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[ConfigActionType.GetParameter];
};

describe('getConfigGetParameterActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the value from the store', async () => {
    configStore.getOrSeedParameterValue.mockResolvedValue('some-value');
    const process = await getProcessor();

    const result = await invokeProcessor(process, { parameterName: 'adminEmail' });

    expect(configStore.getOrSeedParameterValue).toHaveBeenCalledWith('/tmp/runtime', 'adminEmail', expect.anything());
    expect(resolveActionResult(result)).toBe('some-value');
  });

  it('maps a store failure to a caught error', async () => {
    configStore.getOrSeedParameterValue.mockRejectedValue(new Error('boom'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { parameterName: 'adminEmail' });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
