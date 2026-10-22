import { createActionRequester } from '../../types/utils/createActionRequester';
import { UserScriptActionType } from './UserScriptActionType';
import { UserScriptBuildOutcome } from './UserScriptBuildOutcome';

export type UserScriptBuildActionPayload = {
  drive: string;
  // Holds the script project: `src/main.ts` and whatever it imports.
  sourceDirectory: string;
  // Receives `main.js` and `main.js.map`; what askUserScriptExecute is then pointed at.
  outputDirectory: string;
  scope?: string;
};

/**
 * Build a user script project that is already on a drive into `<outputDirectory>/main.js`,
 * on whichever runtime is calling. Only services that registered defineUserScriptBuilder
 * can process it. The project may import quidproquo-core and its own files; npm packages
 * and Node builtins are refused.
 */
export const askUserScriptBuild = createActionRequester<UserScriptBuildOutcome>()({
  actionType: UserScriptActionType.Build,
  errorTypes: [
    'SourceNotFound', // no src/main.ts or src/main.js under the source directory
    'SourceTooLarge', // too many files, too many bytes, or a node_modules folder in the source
    'BuildFailed', // rspack reported errors, a refused import among them
    'OutputNotSingleFile', // the build emitted more than one JavaScript file
    'NoExports', // the built module exports nothing
    'NonFunctionExport', // an export of the built module is not a function
    'DriveNotFound', // the storage drive does not exist
    'InvalidScope', // the scope is not a valid single path segment, or the drive refuses it
  ],
  getPayload: (drive: string, sourceDirectory: string, outputDirectory: string, scope?: string) => ({
    drive,
    sourceDirectory,
    outputDirectory,
    scope,
  }),
});
