import {
  askFileDelete,
  askFileExists,
  askFileReadTextContents,
  askFileWriteTextContents,
  askNewGuid,
  AskResponse,
  createUserScriptCaller,
} from 'quidproquo';

import { SMOKE_PROBE_DRIVE } from '@qpqjs/constants';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { SMOKE_USER_SCRIPT_SOURCE } from '../constants/SMOKE_USER_SCRIPT_SOURCE';
import { SmokeUserScriptFunctions } from './SmokeUserScriptFunctions';

// A user script stored on a drive is loaded by the runtime that is calling and
// its exports are callable by name: a generator export runs as a story whose
// own actions reach the real processors (it writes a file we can read back),
// and a plain export returns its value.
export function* askRunUserScriptTest(): AskResponse<void> {
  const scriptId = yield* askNewGuid();
  const directory = `smoke/userScript/${scriptId}`;
  const entryPath = `${directory}/main.js`;
  const outputPath = `${directory}/output.txt`;

  yield* askFileWriteTextContents(
    SMOKE_PROBE_DRIVE,
    entryPath,
    SMOKE_USER_SCRIPT_SOURCE
  );

  const script = createUserScriptCaller<SmokeUserScriptFunctions>(
    SMOKE_PROBE_DRIVE,
    directory
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

  yield* askFileDelete(SMOKE_PROBE_DRIVE, [entryPath, outputPath]);
}
