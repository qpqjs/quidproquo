import { UserScriptModuleExports } from '@qpqjs/core';

import { loadUserScriptModule } from './loadUserScriptModule';
import { UserScriptModuleMap } from './UserScriptModuleMap';

/**
 * Loads a built script and reports its own enumerable exports without calling any. Throws
 * what loadUserScriptModule throws when the module cannot be loaded.
 */
export const listUserScriptExports = (filename: string, source: string, modules: UserScriptModuleMap): UserScriptModuleExports => {
  const scriptExports = loadUserScriptModule(filename, source, modules);
  const names = Object.keys(scriptExports);

  return {
    functions: names.filter((name) => typeof scriptExports[name] === 'function'),
    nonFunctions: names.filter((name) => typeof scriptExports[name] !== 'function'),
  };
};
