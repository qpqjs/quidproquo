import { buildTestQpqConfig } from 'quidproquo-core';

import path from 'path';
import { describe, expect, it } from 'vitest';
import type { Compiler } from '@rspack/core';

import { QpqPlugin } from './QpqPlugin';

// The plugin reads VirtualModulesPlugin off the compiler's own rspack instance
// (npm-link safety), so the stub carries one.
const buildCompilerStub = (): Compiler =>
  ({
    options: { resolve: {} },
    rspack: {
      experiments: {
        VirtualModulesPlugin: class {
          apply() {}
        },
      },
    },
  }) as unknown as Compiler;

const dynamicLoaderPath = path.resolve('node_modules', 'quidproquo-dynamic-loader.js');

describe('QpqPlugin', () => {
  it('constructs a plugin instance exposing apply', () => {
    const plugin = new QpqPlugin({ qpqConfigs: [buildTestQpqConfig()], nodeModulePath: 'node_modules' });

    expect(plugin).toBeInstanceOf(QpqPlugin);
    expect(typeof plugin.apply).toBe('function');
  });

  it('aliases quidproquo-dynamic-loader to the virtual module path', () => {
    const compiler = buildCompilerStub();

    new QpqPlugin({ qpqConfigs: [buildTestQpqConfig()], nodeModulePath: 'node_modules' }).apply(compiler);

    expect(compiler.options.resolve.alias).toEqual({ 'quidproquo-dynamic-loader': dynamicLoaderPath });
  });

  it('lets app-supplied aliases override the built-in one and merges the rest', () => {
    const compiler = buildCompilerStub();

    new QpqPlugin({
      qpqConfigs: [buildTestQpqConfig()],
      nodeModulePath: 'node_modules',
      aliases: { 'quidproquo-dynamic-loader': '/custom/loader.js', 'other-module': '/other.js' },
    }).apply(compiler);

    expect(compiler.options.resolve.alias).toEqual({
      'quidproquo-dynamic-loader': '/custom/loader.js',
      'other-module': '/other.js',
    });
  });
});
