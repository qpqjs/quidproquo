import {
  askFileDelete,
  askFileExists,
  askFileListDirectory,
  askFileReadTextContents,
  askFileWriteTextContents,
  askNewGuid,
  AskResponse,
} from 'quidproquo';

import { SMOKE_PROBE_DRIVE } from '../../constants/smokeProbe';
import { askSmokeAssert } from '../askSmokeAssert';

// Every S3 action the owned-drive grant covers (PutObject, GetObject,
// ListBucket, DeleteObject). Unlike the other kinds this grant is a bucket
// name-suffix wildcard rather than a tag condition, so it is the one that
// breaks if the naming convention and the policy pattern ever drift apart.
export function* askRunStorageDriveTest(): AskResponse<void> {
  const fileId = yield* askNewGuid();
  const folder = 'smoke';
  const filepath = `${folder}/${fileId}.txt`;
  const contents = `smoke probe ${fileId}`;

  yield* askFileWriteTextContents(SMOKE_PROBE_DRIVE, filepath, contents);

  const exists = yield* askFileExists(SMOKE_PROBE_DRIVE, filepath);
  yield* askSmokeAssert(exists, 'file does not exist after write');

  const readBack = yield* askFileReadTextContents(SMOKE_PROBE_DRIVE, filepath);
  yield* askSmokeAssert(
    readBack === contents,
    'file contents did not read back as written'
  );

  const listing = yield* askFileListDirectory(SMOKE_PROBE_DRIVE, folder);
  yield* askSmokeAssert(
    listing.fileInfos.length > 0,
    'directory listing is empty after write'
  );

  yield* askFileDelete(SMOKE_PROBE_DRIVE, [filepath]);

  const existsAfterDelete = yield* askFileExists(SMOKE_PROBE_DRIVE, filepath);
  yield* askSmokeAssert(!existsAfterDelete, 'file still exists after delete');
}
