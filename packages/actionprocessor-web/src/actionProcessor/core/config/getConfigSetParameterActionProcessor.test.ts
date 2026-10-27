// @vitest-environment jsdom
import { askConfigSetParameter, buildTestQpqConfig, ConfigActionType, ErrorTypeEnum, noopDynamicModuleLoader } from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getConfigSetParameterActionProcessor } from './getConfigSetParameterActionProcessor';

const getProcessor = async () => {
  const processors = await getConfigSetParameterActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[ConfigActionType.SetParameter] as (p: any, ...rest: any[]) => Promise<any>;
};

// Simulates the browser's storage-full DOMException, which is discriminated by name.
const throwQuotaExceededError = () => {
  const quotaError = new Error('full');
  quotaError.name = 'QuotaExceededError';
  throw quotaError;
};

describe('getConfigSetParameterActionProcessor', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the value to local storage and returns success', async () => {
    const processor = await getProcessor();

    const [, error] = await processor({ parameterName: 'token', parameterValue: 'abc' });

    expect(error).toBeUndefined();
    expect(window.localStorage.getItem('token')).toBe('abc');
  });

  it('maps a QuotaExceededError to the QuotaExceeded error type', async () => {
    // Spy on the prototype: jsdom's localStorage is proxy-backed, so an instance-level
    // spy is silently swallowed and never intercepts the call.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(throwQuotaExceededError);
    const processor = await getProcessor();

    const [, error] = await processor({ parameterName: 'token', parameterValue: 'abc' });

    expect(error?.errorType).toBe(askConfigSetParameter.errorType.QuotaExceeded);
  });

  it('maps an unrecognised error to a generic error', async () => {
    const throwUnrecognisedError = () => {
      throw new Error('boom');
    };
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(throwUnrecognisedError);
    const processor = await getProcessor();

    const [, error] = await processor({ parameterName: 'token', parameterValue: 'abc' });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
