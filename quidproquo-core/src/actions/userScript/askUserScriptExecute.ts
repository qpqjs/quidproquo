import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { DynamicFunctionResult, DynamicFunctions } from '../dynamicFunctions/askDynamicFunctionExecute';
import { UserScriptActionType } from './UserScriptActionType';

export type UserScriptExecuteActionPayload = {
  drive: string;
  // The script directory on the drive; the entry is always `<directory>/main.js`.
  directory: string;
  functionName: string;
  args: unknown[];
  scope?: string;
};

// The full catalog of errors the Execute processor can produce itself. Errors thrown
// by the called function's own story propagate with their original type.
export const askUserScriptExecuteBase = createActionRequester<unknown>()({
  actionType: UserScriptActionType.Execute,
  errorTypes: [
    'ScriptNotFound', // no main.js in the script directory
    'InvalidScope', // scope is not a valid single path segment, or the drive refuses it
    'InvalidStorageClass', // the entry is in cold storage and cannot be read
    'ModuleNotFound', // the script required a module outside the shared package list
    'ScriptInvalid', // the script threw while its module body was being loaded
    'FunctionNotFound', // the named export is not an own enumerable function of the module
    'FunctionThrew', // the function threw before returning a story, or its promise rejected
  ],
  getPayload: (drive: string, directory: string, functionName: string, args: unknown[], scope?: string) => ({
    drive,
    directory,
    functionName,
    args,
    scope,
  }),
});

function* askUserScriptExecuteTyped<
  TFunctions extends DynamicFunctions = DynamicFunctions,
  TName extends keyof TFunctions & string = keyof TFunctions & string,
>(
  drive: string,
  directory: string,
  functionName: TName,
  ...args: Parameters<TFunctions[TName]>
): AskResponse<DynamicFunctionResult<TFunctions[TName]>> {
  return (yield* askUserScriptExecuteBase(drive, directory, functionName, args)) as DynamicFunctionResult<TFunctions[TName]>;
}

/**
 * Call one exported function of a user script stored on a drive. A script is a
 * directory whose `main.js` exports functions; the member runs with the same contract
 * as a dynamic-functions member (a generator is driven as a story, a promise awaited).
 * Type the seam by passing the script's functions type:
 * askUserScriptExecute<ScriptFunctions>(drive, directory, 'member', ...args).
 * Carries the base requester's `errorType` catalog so callers can match on it.
 */
export const askUserScriptExecute = Object.assign(askUserScriptExecuteTyped, { errorType: askUserScriptExecuteBase.errorType });
