import { describe, expect, it } from 'vitest';

import { loadUserScriptModule } from './loadUserScriptModule';
import { UserScriptLoadError } from './UserScriptLoadError';
import { UserScriptModuleNotFoundError } from './UserScriptModuleNotFoundError';

const modules = { 'quidproquo-core': { marker: 'core' } };

describe('loadUserScriptModule', () => {
  it('serves an allowlisted require from the module map', () => {
    const exports = loadUserScriptModule('scripts/a/main.js', `exports.core = require('quidproquo-core');`, modules);

    expect(exports.core).toBe(modules['quidproquo-core']);
  });

  it('exposes generator and plain exports alike', () => {
    const exports = loadUserScriptModule(
      'scripts/a/main.js',
      `exports.gen = function* (a) { yield a; return a; }; exports.plain = (a, b) => a + b;`,
      modules,
    );

    expect(typeof exports.gen).toBe('function');
    expect((exports.plain as (a: number, b: number) => number)(1, 2)).toBe(3);
  });

  it('refuses a require outside the map, naming the specifier and the requesting file', () => {
    const load = () => loadUserScriptModule('scripts/a/main.js', `require('fs');`, modules);

    expect(load).toThrow(UserScriptModuleNotFoundError);
    expect(load).toThrow('[scripts/a/main.js] cannot require [fs]');
  });

  it('refuses a relative require the same way', () => {
    const load = () => loadUserScriptModule('scripts/a/main.js', `require('./helpers');`, modules);

    expect(load).toThrow(UserScriptModuleNotFoundError);
    expect(load).toThrow('[./helpers]');
  });

  it('wraps a module body that throws while loading, naming the file', () => {
    const load = () => loadUserScriptModule('scripts/a/main.js', `throw new Error('bad top level');`, modules);

    expect(load).toThrow(UserScriptLoadError);
    expect(load).toThrow('[scripts/a/main.js] threw while loading: bad top level');
  });

  it('wraps a syntax error the same way', () => {
    const load = () => loadUserScriptModule('scripts/a/main.js', `exports.x = ;`, modules);

    expect(load).toThrow(UserScriptLoadError);
  });

  it('names the entry file in stack traces from inside the script', () => {
    const exports = loadUserScriptModule('scripts/a/main.js', `exports.boom = () => { throw new Error('inside'); };`, modules);

    let stack = '';
    try {
      (exports.boom as () => void)();
    } catch (error) {
      stack = (error as Error).stack ?? '';
    }

    expect(stack).toContain('scripts/a/main.js');
  });

  it('gives the script its filename and directory', () => {
    const exports = loadUserScriptModule('scripts/a/main.js', `exports.where = [__filename, __dirname];`, modules);

    expect(exports.where).toEqual(['scripts/a/main.js', 'scripts/a']);
  });
});
