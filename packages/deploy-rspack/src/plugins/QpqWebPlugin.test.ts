import { defineGlobal, defineSecret } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { QpqWebPlugin } from './QpqWebPlugin';

// A stand-in compiler whose rspack.DefinePlugin records the definitions it is given.
const buildCompiler = () => {
  const definitions: Record<string, string>[] = [];

  class DefinePlugin {
    constructor(defs: Record<string, string>) {
      definitions.push(defs);
    }

    apply(): void {}
  }

  return { compiler: { rspack: { DefinePlugin } } as any, definitions };
};

describe('QpqWebPlugin', () => {
  it('constructs a plugin instance exposing apply', () => {
    const plugin = new QpqWebPlugin({ qpqConfig: buildTestQpqConfig() });

    expect(plugin).toBeInstanceOf(QpqWebPlugin);
    expect(typeof plugin.apply).toBe('function');
  });

  // Security regression: the browser bundle is public, so the only config baked into it is the
  // application identity. Globals and secret names stay in the backend bundle.
  it('bakes only the application identity into the bundle, never globals or secret names', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const qpqConfig = buildTestQpqConfig([defineGlobal('internalApiBase', 'https://internal.example'), defineSecret('dbPassword')]);
    const { compiler, definitions } = buildCompiler();

    new QpqWebPlugin({ qpqConfig }).apply(compiler);

    expect(definitions).toHaveLength(1);
    const baked = Object.values(definitions[0]).map((value) => JSON.parse(value));
    for (const info of baked) {
      expect(['environment', 'feature', 'module', 'name']).toEqual(expect.arrayContaining(Object.keys(info)));
      expect(info).toMatchObject({ environment: expect.any(String), module: expect.any(String), name: expect.any(String) });
    }
    expect(JSON.stringify(definitions[0])).not.toContain('internal.example');
    expect(JSON.stringify(definitions[0])).not.toContain('dbPassword');
  });
});
