import { SMOKE_PROBE_DRIVE } from '@qpqjs/constants';
import { askCatch, askNewGuid, AskResponse, askUserScriptBuild } from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

// Building a directory that holds no script fails with the typed SourceNotFound
// error on whichever backend serves the drive: S3 answers an empty listing, the
// dev server refuses the missing directory, and both must land on the same type.
export function* askRunUserScriptBuildErrorTest(): AskResponse<void> {
  const scriptId = yield* askNewGuid();
  const directory = `smoke/userScript/missing-${scriptId}`;

  const result = yield* askCatch(askUserScriptBuild(SMOKE_PROBE_DRIVE, `${directory}/source`, `${directory}/built.js`));

  yield* askSmokeAssert(
    !result.success && result.error.errorType === askUserScriptBuild.errorType.SourceNotFound,
    'building a missing source directory was not refused with SourceNotFound',
  );
}
