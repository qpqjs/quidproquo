import { describe, expect, it, vi } from 'vitest';

import { actionResult } from '../logic/actionLogic';
import { buildTestQpqConfig } from '../testing/configTesting';
import { DynamicModuleLoader } from '../types/DynamicModuleLoader';
import { QpqFunctionRuntimeAdvanced } from '../types/QpqFunctionRuntime';
import { loadRuntimeActionProcessors } from './loadRuntimeActionProcessors';

const qpqConfig = buildTestQpqConfig();

const buildRuntime = (relativePath: string): QpqFunctionRuntimeAdvanced => ({
  basePath: '/service/src',
  relativePath,
  functionName: 'getActionProcessors',
});

// A loader that resolves each runtime to a getActionProcessors-style resolver
// returning the given list, so tests read as "this source provides these processors".
const buildLoader = (listsByRelativePath: Record<string, Record<string, unknown>>): DynamicModuleLoader =>
  (async (runtime: QpqFunctionRuntimeAdvanced) => async () => listsByRelativePath[runtime.relativePath]) as DynamicModuleLoader;

describe('loadRuntimeActionProcessors', () => {
  it('returns an empty list when no sources are attached', async () => {
    const loader = vi.fn() as unknown as DynamicModuleLoader;

    expect(await loadRuntimeActionProcessors(qpqConfig, undefined, loader)).toEqual({});
    expect(await loadRuntimeActionProcessors(qpqConfig, [], loader)).toEqual({});
    expect(loader).not.toHaveBeenCalled();
  });

  it('merges sources in order, last wins', async () => {
    const first = async () => actionResult('first');
    const second = async () => actionResult('second');
    const other = async () => actionResult('other');

    const loader = buildLoader({
      '/a::getActionProcessors': { Shared: first, OnlyA: other },
      '/b::getActionProcessors': { Shared: second },
    });

    const merged = await loadRuntimeActionProcessors(
      qpqConfig,
      [buildRuntime('/a::getActionProcessors'), buildRuntime('/b::getActionProcessors')],
      loader,
    );

    expect(merged['Shared']).toBe(second);
    expect(merged['OnlyA']).toBe(other);
  });

  it('caches loads per loader instance and runtime key', async () => {
    const processor = async () => actionResult('cached');
    const resolveModule = async () => async () => ({ Ping: processor });
    const loader = vi.fn(resolveModule) as unknown as DynamicModuleLoader;

    const runtimes = [buildRuntime('/cached::getActionProcessors')];

    await loadRuntimeActionProcessors(qpqConfig, runtimes, loader);
    await loadRuntimeActionProcessors(qpqConfig, runtimes, loader);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('throws when a source does not resolve to a function', async () => {
    const resolveNonFunction = async () => ({ notA: 'resolver' });
    const loader = resolveNonFunction as unknown as DynamicModuleLoader;

    await expect(loadRuntimeActionProcessors(qpqConfig, [buildRuntime('/bad::getActionProcessors')], loader)).rejects.toThrow(
      'Expected action processor source to be a function',
    );
  });

  it('throws when a source returns non-processor values', async () => {
    const loader = buildLoader({ '/bad::getActionProcessors': { Ping: 'not-a-function' } });

    await expect(loadRuntimeActionProcessors(qpqConfig, [buildRuntime('/bad::getActionProcessors')], loader)).rejects.toThrow(
      'Expected all action processors to be functions',
    );
  });

  it('does not cache failures: a retry after a failed load imports again', async () => {
    const processor = async () => actionResult('recovered');
    const resolveModuleOnceBroken = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient import failure'))
      .mockResolvedValue(async () => ({ Ping: processor }));
    const loader = resolveModuleOnceBroken as unknown as DynamicModuleLoader;

    const runtimes = [buildRuntime('/flaky::getActionProcessors')];

    await expect(loadRuntimeActionProcessors(qpqConfig, runtimes, loader)).rejects.toThrow('transient import failure');

    const merged = await loadRuntimeActionProcessors(qpqConfig, runtimes, loader);

    expect(merged['Ping']).toBe(processor);
    expect(resolveModuleOnceBroken).toHaveBeenCalledTimes(2);
  });
});
