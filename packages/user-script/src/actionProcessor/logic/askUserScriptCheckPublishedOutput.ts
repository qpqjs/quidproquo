import { askCatch, AskResponse, askThrowError, askUserScriptListExports } from 'quidproquo-core';

import { assertUserScriptExports } from '../../build/assertUserScriptExports';
import { UserScriptBuildError, UserScriptBuildErrorCode } from '../../build/UserScriptBuildError';
import { UserScriptBuildErrorCatalog } from './getUserScriptBuildErrorType';

/**
 * The output contract for a platform build, judged inside the sandbox: the runner loads the
 * published file and reports its exports, and the rule is applied here. A load failure is the
 * build's fault (BuildFailed); a runner failure keeps its own type.
 */
export function* askUserScriptCheckPublishedOutput(
  drive: string,
  filepath: string,
  scope: string | undefined,
  errorType: UserScriptBuildErrorCatalog,
): AskResponse<string[]> {
  const listed = yield* askCatch(askUserScriptListExports(drive, filepath, scope));
  if (!listed.success) {
    const loadFailed =
      listed.error.errorType === askUserScriptListExports.errorType.ModuleNotFound ||
      listed.error.errorType === askUserScriptListExports.errorType.ScriptInvalid;
    return yield* askThrowError(loadFailed ? errorType.BuildFailed : listed.error.errorType, listed.error.errorText);
  }

  try {
    return assertUserScriptExports(filepath, listed.result);
  } catch (error) {
    if (error instanceof UserScriptBuildError) {
      const code = error.code as UserScriptBuildErrorCode.NoExports | UserScriptBuildErrorCode.NonFunctionExport;
      return yield* askThrowError(errorType[code], error.message);
    }
    throw error;
  }
}
