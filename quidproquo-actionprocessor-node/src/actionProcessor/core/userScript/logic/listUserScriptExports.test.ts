import { describe, expect, it } from 'vitest';

import { listUserScriptExports } from './listUserScriptExports';
import { UserScriptModuleNotFoundError } from './UserScriptModuleNotFoundError';

describe('listUserScriptExports', () => {
  it('splits exports into functions and other values, in definition order', () => {
    const exports = listUserScriptExports(
      'main.js',
      `exports.b = () => 1; exports.version = 3; exports.a = function* () {}; exports.name = 'x';`,
      {},
    );

    expect(exports).toEqual({ functions: ['b', 'a'], nonFunctions: ['version', 'name'] });
  });

  it('reports an empty module as having no exports of either kind', () => {
    expect(listUserScriptExports('main.js', ``, {})).toEqual({ functions: [], nonFunctions: [] });
  });

  it('lets a load failure through', () => {
    expect(() => listUserScriptExports('main.js', `require('fs');`, {})).toThrow(UserScriptModuleNotFoundError);
  });
});
