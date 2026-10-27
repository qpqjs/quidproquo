import { askFileListAllDirectory, askFileReadTextContents, AskResponse, askThrowError, askUserScriptBuild } from '@qpqjs/core';

import { USER_SCRIPT_SOURCE_LIMITS } from './USER_SCRIPT_SOURCE_LIMITS';
import { UserScriptSourceFile } from './UserScriptSourceFile';

const REFUSED_DIRECTORY = 'node_modules';

const trimSlashes = (directory: string): string => directory.replace(/^\/+|\/+$/g, '');

const toProjectRelative = (sourceDirectory: string, filepath: string): string => {
  const prefix = `${sourceDirectory}/`;
  return filepath.startsWith(prefix) ? filepath.slice(prefix.length) : filepath;
};

/**
 * Reads a script project off a drive: every file under `sourceDirectory`, recursively, as
 * text with paths relative to the project root. Refuses a node_modules folder and enforces
 * USER_SCRIPT_SOURCE_LIMITS, both as the build action's SourceTooLarge. Listing and read
 * failures propagate with their own types for the processor to re-label.
 */
export function* askUserScriptCollectSource(drive: string, sourceDirectory: string, scope?: string): AskResponse<UserScriptSourceFile[]> {
  const root = trimSlashes(sourceDirectory);
  const pending: string[] = [root];
  const filePaths: string[] = [];

  while (pending.length > 0) {
    const directory = pending.shift() as string;
    const entries = yield* askFileListAllDirectory(drive, directory, scope);

    for (const entry of entries) {
      const relative = toProjectRelative(root, entry.filepath);
      if (relative.split('/').includes(REFUSED_DIRECTORY)) {
        return yield* askThrowError(
          askUserScriptBuild.errorType.SourceTooLarge,
          `[${drive}:${root}] contains a ${REFUSED_DIRECTORY} folder; dependencies are not supported in a user script yet`,
        );
      }

      if (entry.isDir) {
        pending.push(trimSlashes(entry.filepath));
      } else {
        filePaths.push(entry.filepath);
      }
    }

    if (filePaths.length > USER_SCRIPT_SOURCE_LIMITS.maxFiles) {
      return yield* askThrowError(
        askUserScriptBuild.errorType.SourceTooLarge,
        `[${drive}:${root}] has more than ${USER_SCRIPT_SOURCE_LIMITS.maxFiles} files`,
      );
    }
  }

  const files: UserScriptSourceFile[] = [];
  let totalBytes = 0;
  for (const filepath of filePaths) {
    const text = yield* askFileReadTextContents(drive, filepath, scope);
    totalBytes += Buffer.byteLength(text, 'utf8');
    if (totalBytes > USER_SCRIPT_SOURCE_LIMITS.maxBytes) {
      return yield* askThrowError(
        askUserScriptBuild.errorType.SourceTooLarge,
        `[${drive}:${root}] is larger than ${USER_SCRIPT_SOURCE_LIMITS.maxBytes} bytes`,
      );
    }
    files.push({ path: toProjectRelative(root, filepath), text });
  }

  return files;
}
