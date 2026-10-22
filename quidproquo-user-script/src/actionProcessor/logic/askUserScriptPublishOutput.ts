import { askFileWriteTextContents, AskResponse } from 'quidproquo-core';

import { USER_SCRIPT_OUTPUT_FILENAME } from '../../build/USER_SCRIPT_OUTPUT_FILENAME';

/** Writes a built script and its source map to the output directory on a drive. */
export function* askUserScriptPublishOutput(
  drive: string,
  outputDirectory: string,
  script: string,
  sourceMap: string,
  scope?: string,
): AskResponse<void> {
  const directory = outputDirectory.replace(/\/+$/, '');

  yield* askFileWriteTextContents(drive, `${directory}/${USER_SCRIPT_OUTPUT_FILENAME}`, script, undefined, scope);
  yield* askFileWriteTextContents(drive, `${directory}/${USER_SCRIPT_OUTPUT_FILENAME}.map`, sourceMap, undefined, scope);
}
