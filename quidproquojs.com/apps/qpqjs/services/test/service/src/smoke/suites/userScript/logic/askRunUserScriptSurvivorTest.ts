import { SMOKE_PROBE_DRIVE } from '@qpqjs/constants';
import { askFileDelete, askFileWriteTextContents, askGuidNew, AskResponse, askUserScriptBuild, createUserScriptCaller } from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { SMOKE_SURVIVOR_PORT } from '../constants/SMOKE_SURVIVOR_PORT';
import { SMOKE_USER_SCRIPT_SOURCES } from '../generated/SMOKE_USER_SCRIPT_SOURCES';
import { SmokeUserScriptFunctions } from './SmokeUserScriptFunctions';

// Proves a script call cannot outlive itself in the runner. The first call ignores the
// runner's kill and starts a grandchild holding a loopback port; the second call, a fresh
// sandbox in the same (warm) runner, must find nothing answering on it. A survivor could
// otherwise sit in a reused runner and take the next caller's event off the runtime api.
export function* askRunUserScriptSurvivorTest(): AskResponse<void> {
  const scriptId = yield* askGuidNew();
  const directory = `smoke/userScript/survivor-${scriptId}`;
  const sourceDirectory = `${directory}/source`;
  const builtPath = `${directory}/built.js`;

  for (const relativePath of Object.keys(SMOKE_USER_SCRIPT_SOURCES)) {
    yield* askFileWriteTextContents(SMOKE_PROBE_DRIVE, `${sourceDirectory}/${relativePath}`, SMOKE_USER_SCRIPT_SOURCES[relativePath]);
  }
  yield* askUserScriptBuild(SMOKE_PROBE_DRIVE, sourceDirectory, builtPath);

  const script = createUserScriptCaller<SmokeUserScriptFunctions>(SMOKE_PROBE_DRIVE, builtPath);
  const survivorPid = yield* script.startSurvivor(SMOKE_SURVIVOR_PORT);
  yield* askSmokeAssert(survivorPid > 0, 'the script could not start a process of its own');
  const probe = yield* script.checkSurvivor(SMOKE_SURVIVOR_PORT);
  yield* askSmokeAssert(!probe.reachable, `a process started by an earlier script call is still alive in the runner (${probe.detail})`);

  yield* askFileDelete(SMOKE_PROBE_DRIVE, [
    ...Object.keys(SMOKE_USER_SCRIPT_SOURCES).map((relativePath) => `${sourceDirectory}/${relativePath}`),
    builtPath,
  ]);
}
