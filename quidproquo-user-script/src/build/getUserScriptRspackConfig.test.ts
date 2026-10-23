import { describe, expect, it } from 'vitest';

import { getUserScriptRspackConfig } from './getUserScriptRspackConfig';

const config = getUserScriptRspackConfig({ projectDir: '/project', entryPath: '/project/src/main.ts', outDir: '/project/dist', sourceMap: false });

describe('getUserScriptRspackConfig', () => {
  it('builds the one entry to main.js as a commonjs module, with no source map by default', () => {
    expect(config.entry).toEqual({ main: '/project/src/main.ts' });
    expect(config.output).toMatchObject({ path: '/project/dist', filename: 'main.js', library: { type: 'commonjs2' } });
    expect(config.devtool).toBe(false);
    expect(config.target).toBe('node');
  });

  it('embeds the source map inline when asked, never as a separate file', () => {
    const withMap = getUserScriptRspackConfig({
      projectDir: '/project',
      entryPath: '/project/src/main.ts',
      outDir: '/project/dist',
      sourceMap: true,
    });

    expect(withMap.devtool).toBe('inline-source-map');
  });

  it('forces a single file: no chunk splitting, no runtime chunk, eager dynamic imports', () => {
    expect(config.optimization).toMatchObject({ minimize: false, splitChunks: false, runtimeChunk: false });
    expect(config.module?.parser).toEqual({ javascript: { dynamicImportMode: 'eager' } });
  });

  it('compiles TypeScript with the swc rule', () => {
    const tsRule = config.module?.rules?.find((rule) => rule && typeof rule === 'object' && String(rule.test) === String(/\.ts$/));

    expect(tsRule).toMatchObject({ loader: 'builtin:swc-loader' });
  });

  it('wires the externals function and resolves from the project first', () => {
    expect(Array.isArray(config.externals) && typeof config.externals[0]).toBe('function');
    expect(config.externalsType).toBe('commonjs');
    expect(config.resolve?.modules?.[0]).toBe('/project/node_modules');
  });
});
