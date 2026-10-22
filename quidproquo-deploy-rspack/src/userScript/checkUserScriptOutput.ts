import { getUserScriptModuleMap, loadUserScriptModule } from 'quidproquo-actionprocessor-node';

import fs from 'fs';

import { UserScriptBuildError, UserScriptBuildErrorCode } from './UserScriptBuildError';

/**
 * The output contract, enforced once here: the built file loads under the same loader
 * the execute processor uses, with the real shared packages, and every own enumerable
 * export is a function. Returns the export names in definition order.
 */
export const checkUserScriptOutput = (entryPath: string): string[] => {
  const scriptExports = loadUserScriptModule(entryPath, fs.readFileSync(entryPath, 'utf8'), getUserScriptModuleMap());
  const names = Object.keys(scriptExports);

  if (names.length === 0) {
    throw new UserScriptBuildError(UserScriptBuildErrorCode.NoExports, `[${entryPath}] exports nothing; a script must export at least one function`);
  }

  const nonFunction = names.find((name) => typeof scriptExports[name] !== 'function');
  if (nonFunction) {
    throw new UserScriptBuildError(
      UserScriptBuildErrorCode.NonFunctionExport,
      `[${entryPath}] export [${nonFunction}] is not a function; a script may only export functions`,
    );
  }

  return names;
};
