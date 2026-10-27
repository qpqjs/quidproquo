import { buildTestQpqConfig } from 'quidproquo-core';

import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { Compiler } from 'webpack';

import { QpqPlugin } from './QpqPlugin';

vi.mock('webpack-virtual-modules', () => ({
  default: class {
    apply() {}
  },
}));

const buildCompilerStub = (): Compiler => ({ options: { resolve: {} } }) as unknown as Compiler;

const dynamicLoaderPath = path.resolve('node_modules', 'quidproquo-dynamic-loader.js');

describe('QpqPlugin', () => {
  it('constructs a webpack plugin instance exposing apply', () => {
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
