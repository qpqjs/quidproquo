import {
  askCatch,
  askNewGuid,
  AskResponse,
  askUserScriptExecute,
} from 'quidproquo';

import { SMOKE_PROBE_DRIVE } from '@qpqjs/constants';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

// Calling a script that was never stored fails with the typed ScriptNotFound
// error, not a generic failure, on whichever backend serves the drive.
export function* askRunUserScriptErrorTest(): AskResponse<void> {
  const scriptId = yield* askNewGuid();

  const result = yield* askCatch(
    askUserScriptExecute(
      SMOKE_PROBE_DRIVE,
      `smoke/userScript/missing-${scriptId}`,
      'anything'
    )
  );

  yield* askSmokeAssert(
    !result.success &&
      result.error.errorType === askUserScriptExecute.errorType.ScriptNotFound,
    'missing script was not refused with ScriptNotFound'
  );
}
