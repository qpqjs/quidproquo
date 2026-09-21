import {
  askCatch,
  askFileDelete,
  askFileExists,
  askFileListDirectory,
  askFileReadTextContents,
  askFileWriteTextContents,
  askNewGuid,
  AskResponse,
} from 'quidproquo';

import { SMOKE_PROBE_DRIVE } from '@qpqjs/constants';

import { SMOKE_SCOPED_PROBE_DRIVE } from '../../constants/smokeProbe';
import { askSmokeAssert } from '../askSmokeAssert';

// The scope gate on a drive, on whichever backend is running: a scoped drive
// serves scoped calls and keeps two scopes apart, refuses an unscoped call,
// and an unscoped drive refuses a scoped one. Each refusal must be the typed
// InvalidScope error, not a generic failure.
export function* askRunScopedStorageDriveTest(): AskResponse<void> {
  const fileId = yield* askNewGuid();
  const scopeA = `smoke-a-${fileId}`;
  const scopeB = `smoke-b-${fileId}`;
  const folder = 'scoped';
  const filepath = `${folder}/${fileId}.txt`;
  const contents = `scoped smoke probe ${fileId}`;

  yield* askFileWriteTextContents(
    SMOKE_SCOPED_PROBE_DRIVE,
    filepath,
    contents,
    undefined,
    scopeA
  );

  const readBack = yield* askFileReadTextContents(
    SMOKE_SCOPED_PROBE_DRIVE,
    filepath,
    scopeA
  );
  yield* askSmokeAssert(
    readBack === contents,
    'scoped file contents did not read back as written'
  );

  const listingA = yield* askFileListDirectory(
    SMOKE_SCOPED_PROBE_DRIVE,
    folder,
    undefined,
    undefined,
    scopeA
  );
  yield* askSmokeAssert(
    listingA.fileInfos.some((info) => info.filepath === filepath),
    'scoped listing does not show the file under its own scope'
  );

  const existsInB = yield* askFileExists(
    SMOKE_SCOPED_PROBE_DRIVE,
    filepath,
    scopeB
  );
  yield* askSmokeAssert(
    !existsInB,
    'file written under scope A is visible from scope B'
  );

  const unscopedRead = yield* askCatch(
    askFileReadTextContents(SMOKE_SCOPED_PROBE_DRIVE, filepath)
  );
  yield* askSmokeAssert(
    !unscopedRead.success &&
      unscopedRead.error.errorType ===
        askFileReadTextContents.errorType.InvalidScope,
    'unscoped read on the scoped drive was not refused with InvalidScope'
  );

  const unscopedList = yield* askCatch(
    askFileListDirectory(SMOKE_SCOPED_PROBE_DRIVE, folder)
  );
  yield* askSmokeAssert(
    !unscopedList.success &&
      unscopedList.error.errorType ===
        askFileListDirectory.errorType.InvalidScope,
    'unscoped listing on the scoped drive was not refused with InvalidScope'
  );

  const scopedWriteOnUnscopedDrive = yield* askCatch(
    askFileWriteTextContents(
      SMOKE_PROBE_DRIVE,
      filepath,
      contents,
      undefined,
      scopeA
    )
  );
  yield* askSmokeAssert(
    !scopedWriteOnUnscopedDrive.success &&
      scopedWriteOnUnscopedDrive.error.errorType ===
        askFileWriteTextContents.errorType.InvalidScope,
    'scoped write on the unscoped drive was not refused with InvalidScope'
  );

  yield* askFileDelete(SMOKE_SCOPED_PROBE_DRIVE, [filepath], scopeA);

  const existsAfterDelete = yield* askFileExists(
    SMOKE_SCOPED_PROBE_DRIVE,
    filepath,
    scopeA
  );
  yield* askSmokeAssert(
    !existsAfterDelete,
    'scoped file still exists after delete'
  );
}
