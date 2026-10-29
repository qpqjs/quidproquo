import { SMOKE_PROBE_DRIVE } from '@qpqjs/constants';
import { askFileDelete, askFileWriteTextContents, askNewGuid, AskResponse, askUserScriptBuild } from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { SMOKE_USER_SCRIPT_SOURCES } from '../generated/SMOKE_USER_SCRIPT_SOURCES';
import { askRunSmokeUserScriptCalls } from './askRunSmokeUserScriptCalls';

// The whole user-script loop on the runtime that is calling: a TypeScript project
// (apps/qpqjs/userScripts/smoke) is written to a drive, built on the platform with
// askUserScriptBuild into one file, and that file's exports are then callable by name,
// each call running in the service's sandbox (see askRunSmokeUserScriptCalls).
export function* askRunUserScriptTest(): AskResponse<void> {
  const scriptId = yield* askNewGuid();
  const directory = `smoke/userScript/${scriptId}`;
  const sourceDirectory = `${directory}/source`;
  const builtPath = `${directory}/built.js`;
  const outputPath = `${directory}/output.txt`;

  const sourcePaths = Object.keys(SMOKE_USER_SCRIPT_SOURCES).map((relativePath) => `${sourceDirectory}/${relativePath}`);
  for (const relativePath of Object.keys(SMOKE_USER_SCRIPT_SOURCES)) {
    yield* askFileWriteTextContents(SMOKE_PROBE_DRIVE, `${sourceDirectory}/${relativePath}`, SMOKE_USER_SCRIPT_SOURCES[relativePath]);
  }

  const built = yield* askUserScriptBuild(SMOKE_PROBE_DRIVE, sourceDirectory, builtPath);
  yield* askSmokeAssert(
    built.exports.includes('add') && built.exports.includes('greet'),
    `platform build did not report the script's exports: [${built.exports.join(', ')}]`,
  );

  yield* askRunSmokeUserScriptCalls(builtPath, outputPath, 'smoke');

  yield* askFileDelete(SMOKE_PROBE_DRIVE, [...sourcePaths, builtPath, outputPath]);
}
