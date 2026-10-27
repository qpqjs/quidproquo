// @vitest-environment jsdom
import { buildTestQpqConfig, noopDynamicModuleLoader } from 'quidproquo-core';
import { QueryParamsActionType } from 'quidproquo-web';

import { beforeEach, describe, expect, it } from 'vitest';

import { getQueryParamsGetActionProcessor } from './getQueryParamsGetActionProcessor';

const getProcessor = async () => {
  const processors = await getQueryParamsGetActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[QueryParamsActionType.Get] as (p: any, ...rest: any[]) => Promise<any>;
};

describe('getQueryParamsGetActionProcessor', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?tag=a&tag=b&other=c');
  });

  it('returns every value for the requested key', async () => {
    const processor = await getProcessor();

    const [result] = await processor({ key: 'tag' });

    expect(result).toEqual(['a', 'b']);
  });

  it('returns an empty array when the key is absent', async () => {
    const processor = await getProcessor();

    const [result] = await processor({ key: 'missing' });

    expect(result).toEqual([]);
  });
});
