import { createActionRequester } from '../../types/utils/createActionRequester';
import { UserScriptActionType } from './UserScriptActionType';
import { UserScriptBuildOptions } from './UserScriptBuildOptions';
import { UserScriptBuildOutcome } from './UserScriptBuildOutcome';

export type UserScriptBuildFromZipActionPayload = {
  drive: string;
  // A zip of the script project: `src/main.ts` and whatever it imports, either at the
  // zip root or inside one top-level folder.
  zipFilepath: string;
  // The exact file the built JavaScript is written to, and what askUserScriptExecute is then
  // pointed at. Nothing else is written.
  outputFilepath: string;
  scope?: string;
  // Embed a source map in the output file. Never a separate `.map` file.
  sourceMap: boolean;
};

/**
 * Build a user script project stored as one zip file on a drive into one file at
 * `outputFilepath`, on whichever runtime is calling. The same contract and
 * limits as askUserScriptBuild, with the source arriving as an archive instead of loose
 * files. Only services that registered defineUserScriptBuilder can process it.
 */
export const askUserScriptBuildFromZip = createActionRequester<UserScriptBuildOutcome>()({
  actionType: UserScriptActionType.BuildFromZip,
  errorTypes: [
    'SourceNotFound', // no zip at the path, or no src/main.ts or src/main.js inside it
    'SourceTooLarge', // the zip, its file count, its unpacked bytes, or a node_modules folder exceed the limits
    'InvalidArchive', // the file is not a zip this runtime can read, or an entry is encrypted or corrupt
    'UnsafeArchiveEntry', // an entry path would escape the project, or an entry is a symlink
    'BuildFailed', // rspack reported errors, a refused import among them
    'OutputNotSingleFile', // the build emitted anything besides the one output file
    'NoExports', // the built module exports nothing
    'NonFunctionExport', // an export of the built module is not a function
    'DriveNotFound', // the storage drive does not exist
    'InvalidScope', // the scope is not a valid single path segment, or the drive refuses it
  ],
  getPayload: (drive: string, zipFilepath: string, outputFilepath: string, scope?: string, options?: UserScriptBuildOptions) => ({
    drive,
    zipFilepath,
    outputFilepath,
    scope,
    sourceMap: options?.sourceMap ?? false,
  }),
});
