// @vitest-environment jsdom
import { buildTestQpqConfig, noopDynamicModuleLoader } from 'quidproquo-core';
import { QueryParamsActionType } from 'quidproquo-web';

import { beforeEach, describe, expect, it } from 'vitest';

import { getQueryParamsGetAllActionProcessor } from './getQueryParamsGetAllActionProcessor';

const getProcessor = async () => {
  const processors = await getQueryParamsGetAllActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[QueryParamsActionType.GetAll] as (p: any, ...rest: any[]) => Promise<any>;
};

describe('getQueryParamsGetAllActionProcessor', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?tag=a&tag=b&other=c');
  });

  it('groups every value by key', async () => {
    const processor = await getProcessor();

    const [result] = await processor(undefined);

    expect(result).toEqual({ tag: ['a', 'b'], other: ['c'] });
  });

  // Anyone can put these keys in a link; a lookup that falls through to Object.prototype
  // would throw on the first one, taking every other param on the page down with it.
  it('treats a key that names an inherited object property as an ordinary param', async () => {
    window.history.replaceState(null, '', '/?toString=1&constructor=2&hasOwnProperty=3&tag=a');
    const processor = await getProcessor();

    const [result] = await processor(undefined);

    expect(result).toEqual({ toString: ['1'], constructor: ['2'], hasOwnProperty: ['3'], tag: ['a'] });
  });

  it('drops a __proto__ key instead of changing the result object', async () => {
    window.history.replaceState(null, '', '/?__proto__=x&tag=a');
    const processor = await getProcessor();

    const [result] = await processor(undefined);

    expect(result).toEqual({ tag: ['a'] });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });

  it('returns an empty object when there are no query params', async () => {
    window.history.replaceState(null, '', '/');
    const processor = await getProcessor();

    const [result] = await processor(undefined);

    expect(result).toEqual({});
  });
});
