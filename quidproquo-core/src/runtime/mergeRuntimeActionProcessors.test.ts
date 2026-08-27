import { describe, expect, it, vi } from 'vitest';

import { actionResult } from '../logic/actionLogic';
import { buildTestQpqConfig } from '../testing/configTesting';
import { noopDynamicModuleLoader } from '../testing/runtimeTesting';
import { DynamicModuleLoader } from '../types/DynamicModuleLoader';
import { QpqFunctionRuntimeAdvanced } from '../types/QpqFunctionRuntime';
import { mergeRuntimeActionProcessors } from './mergeRuntimeActionProcessors';

const qpqConfig = buildTestQpqConfig();

describe('mergeRuntimeActionProcessors', () => {
  it('returns the base list itself when the runtime is not advanced or has nothing attached', async () => {
    const base = { Ping: async () => actionResult('pong') };
    const loader = vi.fn() as unknown as DynamicModuleLoader;

    // Identity matters, not just equality: qpqExecuteLog's replay list is a Proxy
    // whose processors only exist through its get trap, so any copy would lose them.
    expect(await mergeRuntimeActionProcessors(qpqConfig, undefined, base, loader)).toBe(base);
    expect(await mergeRuntimeActionProcessors(qpqConfig, '/plain/route::handler', base, loader)).toBe(base);

    const advancedWithoutOverrides: QpqFunctionRuntimeAdvanced = { basePath: '/svc/src', relativePath: '/r::h', functionName: 'h' };
    expect(await mergeRuntimeActionProcessors(qpqConfig, advancedWithoutOverrides, base, loader)).toBe(base);

    expect(loader).not.toHaveBeenCalled();
  });

  it('merges attached override sources over the base list, last wins', async () => {
    const baseProcessor = async () => actionResult('base');
    const overrideProcessor = async () => actionResult('override');
    const base = { Kept: baseProcessor, Overridden: baseProcessor };

    const loadOverrideSource = (async () => async () => ({ Overridden: overrideProcessor })) as DynamicModuleLoader;

    const runtime: QpqFunctionRuntimeAdvanced = {
      basePath: '/svc/src',
      relativePath: '/r::h',
      functionName: 'h',
      actionProcessors: [{ basePath: '/svc/src', relativePath: '/overrides::getOverrides', functionName: 'getOverrides' }],
    };

    const merged = await mergeRuntimeActionProcessors(qpqConfig, runtime, base, loadOverrideSource);

    expect(merged['Kept']).toBe(baseProcessor);
    expect(merged['Overridden']).toBe(overrideProcessor);
    expect(merged).not.toBe(base);
  });

  it('propagates a failed override load instead of falling back to the base list', async () => {
    const runtime: QpqFunctionRuntimeAdvanced = {
      basePath: '/svc/src',
      relativePath: '/r::h',
      functionName: 'h',
      actionProcessors: [{ basePath: '/svc/src', relativePath: '/missing::getOverrides', functionName: 'getOverrides' }],
    };

    // noopDynamicModuleLoader resolves null, which fails source validation.
    await expect(mergeRuntimeActionProcessors(qpqConfig, runtime, {}, noopDynamicModuleLoader as DynamicModuleLoader)).rejects.toThrow(
      'Expected action processor source to be a function',
    );
  });
});
