// @vitest-environment jsdom
import { buildTestQpqConfig, ConfigActionType, ErrorTypeEnum, noopDynamicModuleLoader } from 'quidproquo-core';

import { beforeEach, describe, expect, it } from 'vitest';

import { getConfigGetParameterActionProcessor } from './getConfigGetParameterActionProcessor';

const getProcessor = async () => {
  const processors = await getConfigGetParameterActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[ConfigActionType.GetParameter] as (p: any, ...rest: any[]) => Promise<any>;
};

describe('getConfigGetParameterActionProcessor', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the value stored in local storage', async () => {
    window.localStorage.setItem('apiUrl', 'https://example.com');
    const processor = await getProcessor();

    const [result] = await processor({ parameterName: 'apiUrl' });

    expect(result).toBe('https://example.com');
  });

  it('returns a NotFound error when the parameter is absent', async () => {
    const processor = await getProcessor();

    const [, error] = await processor({ parameterName: 'missing' });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });
});
