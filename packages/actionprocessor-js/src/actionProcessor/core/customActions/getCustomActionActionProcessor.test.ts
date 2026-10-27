import { actionResult, buildTestQpqConfig, defineActionProcessors, DynamicModuleLoader } from 'quidproquo-core';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCustomActionActionProcessor } from './getCustomActionActionProcessor';

const customType = 'custom/echo';
const customProcessor = async () => actionResult('echoed');

describe('getCustomActionActionProcessor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('merges the processors loaded from every configured source', async () => {
    const qpqConfig = buildTestQpqConfig([defineActionProcessors('/a::get'), defineActionProcessors('/b::get')]);
    const loader: DynamicModuleLoader = async () => async () => ({ [customType]: customProcessor });

    const apl = await getCustomActionActionProcessor(qpqConfig, loader);

    expect(apl[customType]).toBe(customProcessor);
  });

  it('returns an empty list when there are no action processor sources', async () => {
    const apl = await getCustomActionActionProcessor(buildTestQpqConfig(), async () => null);

    expect(apl).toEqual({});
  });

  it('skips a source whose module is not a resolver function', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const qpqConfig = buildTestQpqConfig([defineActionProcessors('/a::get')]);
    const loader: DynamicModuleLoader = async () => ({ notAFunction: true }) as any;

    const apl = await getCustomActionActionProcessor(qpqConfig, loader);

    expect(apl).toEqual({});
  });

  it('skips a source whose resolver does not return an object', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const qpqConfig = buildTestQpqConfig([defineActionProcessors('/a::get')]);
    const loader: DynamicModuleLoader = async () => async () => 'not-an-object' as any;

    const apl = await getCustomActionActionProcessor(qpqConfig, loader);

    expect(apl).toEqual({});
  });

  it('skips a source whose processor list contains a non-function value', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const qpqConfig = buildTestQpqConfig([defineActionProcessors('/a::get')]);
    const loader: DynamicModuleLoader = async () => async () => ({ [customType]: 'nope' }) as any;

    const apl = await getCustomActionActionProcessor(qpqConfig, loader);

    expect(apl).toEqual({});
  });
});
