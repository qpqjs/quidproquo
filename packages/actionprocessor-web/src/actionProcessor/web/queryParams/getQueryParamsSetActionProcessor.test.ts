// @vitest-environment jsdom
import { buildTestQpqConfig, noopDynamicModuleLoader } from 'quidproquo-core';
import { QueryParamsActionType } from 'quidproquo-web';

import { beforeEach, describe, expect, it } from 'vitest';

import { getQueryParamsSetActionProcessor } from './getQueryParamsSetActionProcessor';

const getProcessor = async () => {
  const processors = await getQueryParamsSetActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[QueryParamsActionType.Set] as (p: any, ...rest: any[]) => Promise<any>;
};

describe('getQueryParamsSetActionProcessor', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/page?keep=1');
  });

  it('replaces the key with the supplied values', async () => {
    const processor = await getProcessor();

    await processor({ key: 'tag', values: ['a', 'b'], createHistoryEntry: false });

    const params = new URLSearchParams(window.location.search);
    expect(params.getAll('tag')).toEqual(['a', 'b']);
    expect(window.location.pathname).toBe('/page');
  });

  it('removes the key when given no values', async () => {
    window.history.replaceState(null, '', '/page?tag=a&keep=1');
    const processor = await getProcessor();

    await processor({ key: 'tag', values: [], createHistoryEntry: false });

    const params = new URLSearchParams(window.location.search);
    expect(params.has('tag')).toBe(false);
    expect(params.get('keep')).toBe('1');
  });

  it('preserves the hash fragment when setting params', async () => {
    window.history.replaceState(null, '', '/page?keep=1#section');
    const processor = await getProcessor();

    await processor({ key: 'tag', values: ['a'], createHistoryEntry: false });

    expect(window.location.hash).toBe('#section');
    expect(new URLSearchParams(window.location.search).getAll('tag')).toEqual(['a']);
  });

  it('leaves no dangling ? when the last param is removed', async () => {
    window.history.replaceState(null, '', '/page?tag=a');
    const processor = await getProcessor();

    await processor({ key: 'tag', values: [], createHistoryEntry: false });

    expect(window.location.search).toBe('');
    expect(window.location.href.endsWith('?')).toBe(false);
  });

  it('pushes a new history entry when createHistoryEntry is true', async () => {
    const before = window.history.length;
    const processor = await getProcessor();

    await processor({ key: 'tag', values: ['a'], createHistoryEntry: true });

    expect(window.history.length).toBe(before + 1);
  });
});
