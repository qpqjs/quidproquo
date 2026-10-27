import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getModuleLoaderSrcForService } from './getModuleLoaderSrcForService';

describe('getModuleLoaderSrcForService', () => {
  it('guards the service loader with the module name', () => {
    const config = buildTestQpqConfig([], { moduleName: 'billing' });

    const src = getModuleLoaderSrcForService(config, 'serviceName', 'runtime');

    expect(src).toContain('serviceName === String.raw`billing`');
  });
});
