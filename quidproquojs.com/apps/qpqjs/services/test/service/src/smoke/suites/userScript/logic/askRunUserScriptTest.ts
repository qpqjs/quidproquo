import {
  askFileDelete,
  askFileExists,
  askFileReadTextContents,
  askFileWriteTextContents,
  askNewGuid,
  AskResponse,
  askUserScriptBuild,
  createUserScriptCaller,
} from 'quidproquo';

import { SMOKE_PROBE_DRIVE } from '@qpqjs/constants';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { SMOKE_USER_SCRIPT_SOURCES } from '../generated/SMOKE_USER_SCRIPT_SOURCES';
import { SmokeUserScriptFunctions } from './SmokeUserScriptFunctions';

// The whole user-script loop on the runtime that is calling: a TypeScript project
// (apps/qpqjs/userScripts/smoke) is written to a drive, built on the platform with
// askUserScriptBuild into one file, and that file's exports are then callable by name. A generator
// export runs as a story whose own actions reach the real processors (it writes a
// file we can read back), and a plain export returns its value.
export function* askRunUserScriptTest(): AskResponse<void> {
  const scriptId = yield* askNewGuid();
  const directory = `smoke/userScript/${scriptId}`;
  const sourceDirectory = `${directory}/source`;
  const builtPath = `${directory}/built.js`;
  const outputPath = `${directory}/output.txt`;

  const sourcePaths = Object.keys(SMOKE_USER_SCRIPT_SOURCES).map(
    (relativePath) => `${sourceDirectory}/${relativePath}`
  );
  for (const relativePath of Object.keys(SMOKE_USER_SCRIPT_SOURCES)) {
    yield* askFileWriteTextContents(
      SMOKE_PROBE_DRIVE,
      `${sourceDirectory}/${relativePath}`,
      SMOKE_USER_SCRIPT_SOURCES[relativePath]
    );
  }

  const built = yield* askUserScriptBuild(
    SMOKE_PROBE_DRIVE,
    sourceDirectory,
    builtPath
  );
  yield* askSmokeAssert(
    built.exports.includes('add') && built.exports.includes('greet'),
    `platform build did not report the script's exports: [${built.exports.join(', ')}]`
  );

  const script = createUserScriptCaller<SmokeUserScriptFunctions>(
    SMOKE_PROBE_DRIVE,
    builtPath
  );

  const sum = yield* script.add(SMOKE_PROBE_DRIVE, outputPath, 20, 22);
  yield* askSmokeAssert(sum === 42, 'generator export did not return its sum');

  const outputExists = yield* askFileExists(SMOKE_PROBE_DRIVE, outputPath);
  yield* askSmokeAssert(
    outputExists,
    'file written by the script story does not exist'
  );

  const output = yield* askFileReadTextContents(SMOKE_PROBE_DRIVE, outputPath);
  yield* askSmokeAssert(
    output === 'added 42',
    'file written by the script story has the wrong contents'
  );

  const greeting = yield* script.greet('smoke');
  yield* askSmokeAssert(
    greeting === 'hello smoke',
    'plain export did not return its value'
  );

  yield* askFileDelete(SMOKE_PROBE_DRIVE, [
    ...sourcePaths,
    builtPath,
    outputPath,
  ]);
}
