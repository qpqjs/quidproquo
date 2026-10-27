import { compileFunction } from 'node:vm';
import * as path from 'path';

import { UserScriptLoadError } from './UserScriptLoadError';
import { UserScriptModuleMap } from './UserScriptModuleMap';
import { UserScriptModuleNotFoundError } from './UserScriptModuleNotFoundError';

/**
 * Loads one CommonJS module from source text the way Node loads a file: the text is
 * wrapped in a function taking exports/require/module, and `require` only serves the
 * given module map. Runs in the current context; this is not a security boundary.
 * `filename` names the module in stack traces and errors.
 */
export const loadUserScriptModule = (filename: string, source: string, modules: UserScriptModuleMap): Record<string, unknown> => {
  const module = { exports: {} as Record<string, unknown> };

  // A relative specifier never matches a map key, so a multi-file script fails here
  // too, by design: the build step folds files together before they reach a drive.
  const require = (specifier: string): unknown => {
    if (!Object.prototype.hasOwnProperty.call(modules, specifier)) {
      throw new UserScriptModuleNotFoundError(specifier, filename);
    }
    return modules[specifier];
  };

  try {
    const run = compileFunction(source, ['exports', 'require', 'module', '__filename', '__dirname'], { filename });
    run(module.exports, require, module, filename, path.posix.dirname(filename));
  } catch (error) {
    if (error instanceof UserScriptModuleNotFoundError) {
      throw error;
    }
    throw new UserScriptLoadError(filename, error);
  }

  return module.exports;
};
