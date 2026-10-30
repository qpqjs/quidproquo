import { createActionRequester } from '../../logic/actions/createActionRequester';
import { UserScriptActionType } from './UserScriptActionType';
import { UserScriptModuleExports } from './UserScriptModuleExports';

export type UserScriptListExportsActionPayload = {
  drive: string;
  filepath: string;
  scope?: string;
};

/**
 * Loads a built script inside the sandbox and reports its exports, without calling any.
 * The build uses it to check its output contract where the script's own top-level code
 * cannot reach the host.
 */
export const askUserScriptListExports = createActionRequester<UserScriptModuleExports>()({
  actionType: UserScriptActionType.ListExports,
  errorTypes: [
    'ScriptNotFound', // no file at the filepath
    'InvalidScope', // scope is not a valid single path segment, or the drive refuses it
    'ModuleNotFound', // the script required a module outside the shared package list
    'ScriptInvalid', // the script threw while its module body was being loaded
    'RunnerUnavailable', // the sandboxed runner could not be invoked, or answered with something other than a result
    'Timeout', // the runner did not finish within the service's configured runner timeout
  ],
  getPayload: (drive: string, filepath: string, scope?: string) => ({ drive, filepath, scope }),
});
