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
import { getConfigSetParameterActionProcessor } from './getConfigSetParameterActionProcessor';

const { configStore } = vi.hoisted(() => ({
  configStore: { setParameterValue: vi.fn() },
}));

vi.mock('../../../logic/config', () => configStore);

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;

const getProcessor = async () => {
  const processors = await getConfigSetParameterActionProcessor(devServerConfig)(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[ConfigActionType.SetParameter];
};

describe('getConfigSetParameterActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes the value to the store', async () => {
    configStore.setParameterValue.mockResolvedValue(undefined);
    const process = await getProcessor();

    const result = await invokeProcessor(process, { parameterName: 'adminEmail', parameterValue: 'joe@example.com' });

    expect(configStore.setParameterValue).toHaveBeenCalledWith('/tmp/runtime', 'adminEmail', expect.anything(), 'joe@example.com');
    expect(resolveActionResult(result)).toBeUndefined();
  });

  it('maps a store failure to a caught error', async () => {
    configStore.setParameterValue.mockRejectedValue(new Error('boom'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { parameterName: 'adminEmail', parameterValue: 'x' });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
