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
import { getConfigGetParametersActionProcessor } from './getConfigGetParametersActionProcessor';

const { configStore } = vi.hoisted(() => ({
  configStore: { getOrSeedParameterValue: vi.fn() },
}));

vi.mock('../../../logic/config', () => configStore);

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;

const getProcessor = async () => {
  const processors = await getConfigGetParametersActionProcessor(devServerConfig)(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[ConfigActionType.GetParameters];
};

describe('getConfigGetParametersActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the values from the store in request order', async () => {
    configStore.getOrSeedParameterValue.mockImplementation(async (_runtimePath: string, parameterName: string) => `${parameterName}-value`);
    const process = await getProcessor();

    const result = await invokeProcessor(process, { parameterNames: ['a', 'b'] });

    expect(configStore.getOrSeedParameterValue).toHaveBeenCalledTimes(2);
    expect(resolveActionResult(result)).toEqual(['a-value', 'b-value']);
  });

  it('maps a store failure to a caught error', async () => {
    configStore.getOrSeedParameterValue.mockRejectedValue(new Error('boom'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { parameterNames: ['a'] });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
