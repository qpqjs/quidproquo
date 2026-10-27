import { UserScriptModuleExports } from 'quidproquo-core';

import { UserScriptBuildError, UserScriptBuildErrorCode } from './UserScriptBuildError';

/**
 * The output contract, judged on what loading the built module reported: at least one export,
 * and every export a function. Returns the function names in definition order.
 */
export const assertUserScriptExports = (label: string, exports: UserScriptModuleExports): string[] => {
  if (exports.functions.length === 0 && exports.nonFunctions.length === 0) {
    throw new UserScriptBuildError(UserScriptBuildErrorCode.NoExports, `[${label}] exports nothing; a script must export at least one function`);
  }

  const [nonFunction] = exports.nonFunctions;
  if (nonFunction) {
    throw new UserScriptBuildError(
      UserScriptBuildErrorCode.NonFunctionExport,
      `[${label}] export [${nonFunction}] is not a function; a script may only export functions`,
    );
  }

  return exports.functions;
};
