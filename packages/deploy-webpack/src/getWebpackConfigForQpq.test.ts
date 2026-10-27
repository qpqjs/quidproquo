import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineBackendBundleOptions } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';
import { IgnorePlugin } from 'webpack';

import { getAllWebpackConfig, getWebpackConfig } from './getWebpackConfigForQpq';
import { QpqPlugin } from './plugins';

// The function form of a webpack/rspack external, as this package emits it.
type ExternalFunction = (data: { request: string }, callback: (err?: unknown, external?: string) => void) => void;

describe('getWebpackConfig', () => {
  const entries = { handler: './src/handler.ts' };

  it('returns the entries, node target and commonjs output', () => {
    const config = getWebpackConfig(buildTestQpqConfig(), 'out', entries, 'node_modules');

    expect(config.entry).toEqual(entries);
    expect(config.target).toBe('node');
    expect(config.output?.path).toBe('out');
    expect(config.output?.filename).toBe('[name]/index.js');
    expect(config.output?.libraryTarget).toBe('commonjs2');
  });

  it('uses the configured environment as the build mode when it is a webpack mode', () => {
    const config = getWebpackConfig(buildTestQpqConfig([], { environment: 'development' }), 'out', entries, 'node_modules');

    expect(config.mode).toBe('development');
  });

  it('defaults the build mode to production for non-webpack environments', () => {
    const config = getWebpackConfig(buildTestQpqConfig([], { environment: 'staging' }), 'out', entries, 'node_modules');

    expect(config.mode).toBe('production');
  });

  it('registers a QpqPlugin for the config', () => {
    const config = getWebpackConfig(buildTestQpqConfig(), 'out', entries, 'node_modules');

    expect(config.plugins?.[0]).toBeInstanceOf(QpqPlugin);
  });

  it('adds no layer external when no layer provides modules', () => {
    const config = getWebpackConfig(buildTestQpqConfig(), 'out', entries, 'node_modules');

    expect(config.externals).toHaveLength(1);
  });

  describe('layer provided modules', () => {
    const qpqConfig = buildTestQpqConfig([
      defineAwsServiceAccountInfo('111', 'us-east-1', [], {
        apiLayers: [{ name: 'chromium', buildPath: '../layers/chromium.zip', modules: ['@sparticuz/chromium'] }],
      }),
    ]);

    const resolveExternal = (request: string): string | undefined => {
      const config = getWebpackConfig(qpqConfig, 'out', entries, 'node_modules');
      const externals = config.externals as unknown as ExternalFunction[];

      expect(externals).toHaveLength(2);

      let result: string | undefined = undefined;
      externals[1]({ request }, (_err?: unknown, external?: string) => {
        result = external;
      });

      return result;
    };

    it('externalizes a layer provided module', () => {
      expect(resolveExternal('@sparticuz/chromium')).toBe('commonjs2 @sparticuz/chromium');
    });

    it('externalizes subpath imports of a layer provided module', () => {
      expect(resolveExternal('@sparticuz/chromium/bin')).toBe('commonjs2 @sparticuz/chromium/bin');
    });

    it('leaves unrelated modules bundled', () => {
      expect(resolveExternal('@sparticuz/chromium-extra')).toBeUndefined();
      expect(resolveExternal('lodash')).toBeUndefined();
    });
  });

  describe('backend bundle options', () => {
    const qpqConfig = buildTestQpqConfig([
      defineBackendBundleOptions({
        externals: ['sharp'],
        ignoreModules: [{ resource: '^original-fs$', context: 'adm-zip' }],
        ignoreWarnings: [{ module: 'liquidjs', message: 'module\\.createRequire failed parsing argument' }],
      }),
    ]);

    it('externalizes configured externals', () => {
      const config = getWebpackConfig(qpqConfig, 'out', entries, 'node_modules');
      const externals = config.externals as unknown as ExternalFunction[];

      let result: string | undefined = undefined;
      externals[1]({ request: 'sharp' }, (_err?: unknown, external?: string) => {
        result = external;
      });

      expect(result).toBe('commonjs2 sharp');
    });

    it('adds an IgnorePlugin per ignored module', () => {
      const config = getWebpackConfig(qpqConfig, 'out', entries, 'node_modules');

      expect(config.plugins?.[1]).toBeInstanceOf(IgnorePlugin);
    });

    it('appends the configured ignore warnings', () => {
      const config = getWebpackConfig(qpqConfig, 'out', entries, 'node_modules');

      expect(config.ignoreWarnings).toHaveLength(2);
      expect((config.ignoreWarnings?.[1] as { module?: RegExp }).module?.source).toBe('liquidjs');
    });
  });
});

describe('getAllWebpackConfig', () => {
  const entries = { handler: './src/handler.ts' };

  it('passes through the provided output and node module paths', () => {
    const config = getAllWebpackConfig(buildTestQpqConfig(), entries, 'dist', 'vendor');

    expect(config.output?.path).toBe('dist');
  });

  it('defaults the output path to build when omitted', () => {
    const config = getAllWebpackConfig(buildTestQpqConfig(), entries);

    expect(config.output?.path).toBe('build');
  });
});
