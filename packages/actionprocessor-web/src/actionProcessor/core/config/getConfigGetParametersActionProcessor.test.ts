// @vitest-environment jsdom
import { buildTestQpqConfig, ConfigActionType, ErrorTypeEnum, noopDynamicModuleLoader } from 'quidproquo-core';

import { beforeEach, describe, expect, it } from 'vitest';

import { getConfigGetParametersActionProcessor } from './getConfigGetParametersActionProcessor';

const getProcessor = async () => {
  const processors = await getConfigGetParametersActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[ConfigActionType.GetParameters] as (p: any, ...rest: any[]) => Promise<any>;
};

describe('getConfigGetParametersActionProcessor', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the values for every requested parameter, in order', async () => {
    window.localStorage.setItem('a', '1');
    window.localStorage.setItem('b', '2');
    const processor = await getProcessor();

    const [result] = await processor({ parameterNames: ['a', 'b'] });

    expect(result).toEqual(['1', '2']);
  });

  it('returns a NotFound error listing the missing parameters', async () => {
    window.localStorage.setItem('a', '1');
    const processor = await getProcessor();

    const [, error] = await processor({ parameterNames: ['a', 'b'] });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
    expect(error?.errorText).toContain('b');
  });
});
