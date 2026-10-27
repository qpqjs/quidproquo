import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getQpqDynamicLoaderSrcFromQpqConfigs } from './getQpqDynamicLoaderSrcFromQpqConfigs';

describe('getQpqDynamicLoaderSrcFromQpqConfigs', () => {
  it('returns an empty-loader module when no configs are provided', () => {
    const src = getQpqDynamicLoaderSrcFromQpqConfigs([]);

    expect(src).toContain('qpqConfig = undefined');
    expect(src).toContain('qpqConfigs = []');
  });

  it('returns an empty-loader module when configs is undefined', () => {
    const src = getQpqDynamicLoaderSrcFromQpqConfigs(undefined);

    expect(src).toContain('qpqConfigs = []');
  });

  it('embeds the serialised configs and both loader functions', () => {
    const src = getQpqDynamicLoaderSrcFromQpqConfigs([buildTestQpqConfig()]);

    expect(src).toContain('test-app');
    expect(src).toContain('qpqDynamicModuleLoader');
    expect(src).toContain('qpqDynamicModuleLoaderForService');
  });
});
