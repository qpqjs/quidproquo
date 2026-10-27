import { buildTestQpqConfig } from 'quidproquo-core';

import { afterEach, describe, expect, it } from 'vitest';

// NOTE: these tests live here (not next to webpack.config.ts) because vitest's
// default exclude drops any file matching `webpack.config.*`.
import { getResolveLoaderModules, getWebpackBuildMode, setupWebpackQPQRuntime } from './webpack.config';

describe('getWebpackBuildMode', () => {
  it.each([
    ['development', 'development'],
    ['production', 'production'],
    ['staging', 'production'],
    ['none', 'production'],
  ])('maps the %s environment to the %s build mode', (environment: string, expected: string) => {
    expect(getWebpackBuildMode(buildTestQpqConfig([], { environment }))).toBe(expected);
  });
});

describe('getResolveLoaderModules', () => {
  it('returns the local loaders directory followed by node_modules', () => {
    const modules = getResolveLoaderModules();

    expect(modules).toHaveLength(2);
    expect(modules[0].endsWith('loaders')).toBe(true);
    expect(modules[1]).toBe('node_modules');
  });
});

describe('setupWebpackQPQRuntime', () => {
  afterEach(() => {
    delete process.env.QPQLoaderConfig;
  });

  it('serialises the loader config onto the QPQLoaderConfig env var', () => {
    setupWebpackQPQRuntime(buildTestQpqConfig(), './build');

    const loaderConfig = JSON.parse(process.env.QPQLoaderConfig ?? '{}');

    expect(loaderConfig).toMatchObject({
      allSrcEntries: expect.any(Array),
      customActionProcessorSources: expect.any(Array),
      qpqConfig: expect.any(Array),
    });
  });
});
