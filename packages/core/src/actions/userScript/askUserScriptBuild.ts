import { createActionRequester } from '../../types/utils/createActionRequester';
import { UserScriptActionType } from './UserScriptActionType';
import { UserScriptBuildOptions } from './UserScriptBuildOptions';
import { UserScriptBuildOutcome } from './UserScriptBuildOutcome';

export type UserScriptBuildActionPayload = {
  drive: string;
  // Holds the script project: `src/main.ts` and whatever it imports.
  sourceDirectory: string;
  // The exact file the built JavaScript is written to, and what askUserScriptExecute is then
  // pointed at. Nothing else is written.
  outputFilepath: string;
  scope?: string;
  // Embed a source map in the output file. Never a separate `.map` file.
  sourceMap: boolean;
};

/**
 * Build a user script project that is already on a drive into one file at `outputFilepath`,
 * on whichever runtime is calling. Source maps are off unless `options.sourceMap` is set, and
 * then they are embedded in that file. Only services that registered defineUserScriptBuilder
 * can process it. The project may import quidproquo-core and its own files; npm packages
 * and Node builtins are refused.
 */
export const askUserScriptBuild = createActionRequester<UserScriptBuildOutcome>()({
  actionType: UserScriptActionType.Build,
  errorTypes: [
    'SourceNotFound', // no src/main.ts or src/main.js under the source directory
    'SourceTooLarge', // too many files, too many bytes, or a node_modules folder in the source
    'BuildFailed', // rspack reported errors, a refused import among them
    'OutputNotSingleFile', // the build emitted anything besides the one output file
    'NoExports', // the built module exports nothing
    'NonFunctionExport', // an export of the built module is not a function
    'DriveNotFound', // the storage drive does not exist
    'InvalidScope', // the scope is not a valid single path segment, or the drive refuses it
  ],
  getPayload: (drive: string, sourceDirectory: string, outputFilepath: string, scope?: string, options?: UserScriptBuildOptions) => ({
    drive,
    sourceDirectory,
    outputFilepath,
    scope,
    sourceMap: options?.sourceMap ?? false,
  }),
});
