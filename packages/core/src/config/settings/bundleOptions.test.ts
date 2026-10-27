import { describe, expect, it } from 'vitest';

import { getBackendBundleOptions, getFrontendBundleOptions } from '../../qpqCoreUtils';
import { buildTestQpqConfig } from '../../testing';
import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineBackendBundleOptions, defineFrontendBundleOptions } from './bundleOptions';

describe('defineBackendBundleOptions', () => {
  it('builds a BackendBundleOptions setting with defaults for omitted fields', () => {
    expect(defineBackendBundleOptions({ externals: ['sharp'] })).toEqual({
      configSettingType: QPQCoreConfigSettingType.backendBundleOptions,
      uniqueKey: JSON.stringify({ externals: ['sharp'] }),
      externals: ['sharp'],
      ignoreModules: [],
      ignoreWarnings: [],
    });
  });
});

describe('defineFrontendBundleOptions', () => {
  it('builds a FrontendBundleOptions setting', () => {
    expect(defineFrontendBundleOptions({ sharedSingletons: ['chakra', 'zod'] })).toEqual({
      configSettingType: QPQCoreConfigSettingType.frontendBundleOptions,
      uniqueKey: JSON.stringify({ sharedSingletons: ['chakra', 'zod'] }),
      sharedSingletons: ['chakra', 'zod'],
    });
  });
});

describe('getFrontendBundleOptions', () => {
  it('merges every frontend bundle options setting in the config', () => {
    const qpqConfig = buildTestQpqConfig([
      defineFrontendBundleOptions({ sharedSingletons: ['chakra'] }),
      defineFrontendBundleOptions({ sharedSingletons: ['zod'] }),
    ]);

    expect(getFrontendBundleOptions(qpqConfig)).toEqual({ sharedSingletons: ['chakra', 'zod'] });
  });

  it('returns empty lists when nothing is defined', () => {
    expect(getFrontendBundleOptions(buildTestQpqConfig())).toEqual({ sharedSingletons: [] });
  });
});

describe('getBackendBundleOptions', () => {
  it('merges every backend bundle options setting in the config', () => {
    const qpqConfig = buildTestQpqConfig([
      defineBackendBundleOptions({
        ignoreModules: [{ resource: '^original-fs$', context: 'adm-zip' }],
      }),
      defineBackendBundleOptions({
        externals: ['sharp'],
        ignoreWarnings: [{ module: 'liquidjs', message: 'module\\.createRequire failed parsing argument' }],
      }),
    ]);

    expect(getBackendBundleOptions(qpqConfig)).toEqual({
      externals: ['sharp'],
      ignoreModules: [{ resource: '^original-fs$', context: 'adm-zip' }],
      ignoreWarnings: [{ module: 'liquidjs', message: 'module\\.createRequire failed parsing argument' }],
    });
  });

  it('returns empty lists when nothing is defined', () => {
    expect(getBackendBundleOptions(buildTestQpqConfig())).toEqual({
      externals: [],
      ignoreModules: [],
      ignoreWarnings: [],
    });
  });
});
