import { askFileWriteTextContents, AskResponse } from '@qpqjs/core';

/** Writes a built script to exactly `outputFilepath` on a drive; a build publishes nothing else. */
export function* askUserScriptPublishOutput(drive: string, outputFilepath: string, script: string, scope?: string): AskResponse<void> {
  yield* askFileWriteTextContents(drive, outputFilepath, script, undefined, scope);
}
