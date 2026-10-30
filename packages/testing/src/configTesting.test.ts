import { QPQCoreConfigSettingType, qpqCoreUtils } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { buildTestQpqConfig } from './configTesting';

const { getApiBuildPath, getApplicationModuleEnvironment, getApplicationModuleFeature, getApplicationModuleName, getApplicationName, getConfigRoot } =
  qpqCoreUtils;

describe('buildTestQpqConfig', () => {
  it('prepends a default application module so context selectors resolve', () => {
    const config = buildTestQpqConfig();

    expect(getApplicationName(config)).toBe('test-app');
    expect(getApplicationModuleName(config)).toBe('test-module');
    expect(getApplicationModuleEnvironment(config)).toBe('development');
    expect(getConfigRoot(config)).toBe('./');
    expect(getApiBuildPath(config)).toBe('./build');
    expect(getApplicationModuleFeature(config)).toBeUndefined();
  });

  it('applies app option overrides', () => {
    const config = buildTestQpqConfig([], {
      applicationName: 'my-app',
      moduleName: 'my-module',
      environment: 'production',
      feature: 'beta',
    });

    expect(getApplicationName(config)).toBe('my-app');
    expect(getApplicationModuleName(config)).toBe('my-module');
    expect(getApplicationModuleEnvironment(config)).toBe('production');
    expect(getApplicationModuleFeature(config)).toBe('beta');
  });

  it('appends the provided settings after the module', () => {
    const setting = { configSettingType: QPQCoreConfigSettingType.global, uniqueKey: 'x' };
    const config = buildTestQpqConfig([setting]);

    expect(config[config.length - 1]).toBe(setting);
  });
});
