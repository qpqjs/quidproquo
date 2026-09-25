import { buildTestQpqConfig } from 'quidproquo-core';

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RuleSetRule } from '@rspack/core';

import { getDevServerRspackConfig } from './getDevServerRspackConfig';

describe('getDevServerRspackConfig', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-dev-server-config-'));
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'consumer', workspaces: [] }));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('builds a development node config with the dev-server output path', () => {
    const config = getDevServerRspackConfig({ root, entry: './entry.ts', qpqConfigs: [buildTestQpqConfig()] });

    expect(config.mode).toBe('development');
    expect(config.target).toBe('node');
    expect(config.output?.path).toBe(path.join(root, 'dist', 'qpq', 'dev-server'));
  });

  it('externalises node:sqlite to the runtime builtin (the dev-server kvs engine loads it)', async () => {
    const config = getDevServerRspackConfig({ root, entry: './entry.ts', qpqConfigs: [buildTestQpqConfig()] });
    const externalise = (config.externals as any[])[0] as (data: any, callback: (err?: Error, result?: string) => void) => void;

    const resolved = await new Promise((resolve, reject) => {
      externalise({ request: 'node:sqlite', context: root }, (error?: Error, result?: string) => (error ? reject(error) : resolve(result)));
    });

    expect(resolved).toBe('commonjs node:sqlite');
  });

  it('resolves an installed external to its absolute path for the host, but leaves it bare when portable', async () => {
    fs.mkdirSync(path.join(root, 'node_modules', 'immer'), { recursive: true });
    fs.writeFileSync(path.join(root, 'node_modules', 'immer', 'package.json'), JSON.stringify({ name: 'immer', main: 'index.js' }));
    fs.writeFileSync(path.join(root, 'node_modules', 'immer', 'index.js'), '');

    const externaliseWith = (portableExternals: boolean) => {
      const config = getDevServerRspackConfig({ root, entry: './entry.ts', qpqConfigs: [buildTestQpqConfig()], portableExternals });
      const [externalise] = config.externals as unknown as ((data: any, callback: (err?: Error, result?: string) => void) => void)[];
      return new Promise<string | undefined>((resolve, reject) => {
        externalise({ request: 'immer', context: root }, (error?: Error, result?: string) => (error ? reject(error) : resolve(result)));
      });
    };

    expect(await externaliseWith(false)).toBe(`commonjs ${fs.realpathSync(path.join(root, 'node_modules', 'immer', 'index.js'))}`);
    expect(await externaliseWith(true)).toBe('commonjs immer');
  });

  it('includes the shared backend swc TS rules (same as the lambda builds)', () => {
    const config = getDevServerRspackConfig({ root, entry: './entry.ts', qpqConfigs: [buildTestQpqConfig()] });
    const rules = (config.module?.rules ?? []) as RuleSetRule[];

    const tsRule = rules.find((rule) => String(rule.test) === String(/\.ts$/));
    expect(tsRule?.loader).toBe('builtin:swc-loader');

    const assetRule = rules.find((rule) => String(rule.test) === String(/\.(txt|map)$/));
    expect(assetRule?.type).toBe('asset/resource');
  });

  it('externalises bare packages but keeps the dynamic loader bundled', () => {
    const config = getDevServerRspackConfig({ root, entry: './entry.ts', qpqConfigs: [buildTestQpqConfig()] });
    const [externalise] = config.externals as unknown as ((
      data: { request?: string; context?: string },
      callback: (err?: Error, result?: string) => void,
    ) => void)[];

    let bundledResult: string | undefined = 'sentinel';
    externalise({ request: 'quidproquo-dynamic-loader', context: root }, (_err, result) => {
      bundledResult = result;
    });
    expect(bundledResult).toBeUndefined();

    let externalResult: string | undefined;
    externalise({ request: 'some-unresolvable-package', context: root }, (_err, result) => {
      externalResult = result;
    });
    // Unresolvable optional deps stay a plain bare require.
    expect(externalResult).toBe('commonjs some-unresolvable-package');
  });
});
