// @vitest-environment jsdom
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';
import { QueryParamsActionType } from '@qpqjs/web';

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

  // Security regression: a param value or key is encoded into the query only; it can never rewrite the
  // path, origin or hash, and the page never navigates (history state only).
  it.each([
    ['//evil.example/phish', 'returnTo'],
    ['https://evil.example/?x=1#frag', 'next'],
    ['../../admin', 'path'],
    ['<script>alert(1)</script>', 'q'],
    ['a&b=c#hash', 'q'],
  ])('keeps the hostile value %j under key %j inside the query string', async (value: any, key: any) => {
    window.history.replaceState(null, '', '/page?keep=1#top');
    const processor = await getProcessor();

    await processor({ key, values: [value], createHistoryEntry: false });

    expect(window.location.origin).toBe('http://localhost:3000');
    expect(window.location.pathname).toBe('/page');
    expect(window.location.hash).toBe('#top');
    const params = new URLSearchParams(window.location.search);
    expect(params.getAll(key)).toEqual([value]);
    expect(params.get('keep')).toBe('1');
    expect(params.has('b')).toBe(false);
  });

  it('encodes a key that looks like a query separator rather than splitting on it', async () => {
    const processor = await getProcessor();

    await processor({ key: 'a=b&c', values: ['1'], createHistoryEntry: false });

    expect(new URLSearchParams(window.location.search).get('a=b&c')).toBe('1');
    expect(new URLSearchParams(window.location.search).has('c')).toBe(false);
  });

  it('pushes a new history entry when createHistoryEntry is true', async () => {
    const before = window.history.length;
    const processor = await getProcessor();

    await processor({ key: 'tag', values: ['a'], createHistoryEntry: true });

    expect(window.history.length).toBe(before + 1);
  });
});
