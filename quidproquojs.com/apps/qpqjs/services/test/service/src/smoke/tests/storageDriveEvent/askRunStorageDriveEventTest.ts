import {
  askFileDelete,
  askFileWriteTextContents,
  askNewGuid,
  AskResponse,
  StorageDriveEventType,
} from 'quidproquo';

import {
  SMOKE_FILE_EVENT_DRIVE,
  SMOKE_SCOPED_PROBE_DRIVE,
} from '../../constants/smokeProbe';
import { smokeFileEventMarkerId } from '../../storageDrive/smokeFileEventMarkerId';
import { askSmokeAssert } from '../askSmokeAssert';
import { askSmokePollForMarker } from '../askSmokePollForMarker';

// The storage drive event path end to end: a write fires the create handler
// and a delete fires the delete handler, locally through the file watcher and
// deployed through the S3 notification. On the scoped drive the event must
// arrive with the scope as its own field, the path made scope-relative, and
// the handler running under that scope.
export function* askRunStorageDriveEventTest(): AskResponse<void> {
  const fileId = yield* askNewGuid();
  const filepath = `events/${fileId}.txt`;
  const scope = `smoke-ev-${fileId}`;

  yield* askFileWriteTextContents(SMOKE_FILE_EVENT_DRIVE, filepath, fileId);

  const created = yield* askSmokePollForMarker(
    smokeFileEventMarkerId(filepath, StorageDriveEventType.Create),
    'the unscoped drive create event'
  );
  yield* askSmokeAssert(
    created.path === filepath && created.scope === undefined,
    'unscoped create event did not carry the bare path with no scope'
  );

  yield* askFileDelete(SMOKE_FILE_EVENT_DRIVE, [filepath]);

  yield* askSmokePollForMarker(
    smokeFileEventMarkerId(filepath, StorageDriveEventType.Delete),
    'the unscoped drive delete event'
  );

  yield* askFileWriteTextContents(
    SMOKE_SCOPED_PROBE_DRIVE,
    filepath,
    fileId,
    undefined,
    scope
  );

  const scopedCreated = yield* askSmokePollForMarker(
    smokeFileEventMarkerId(filepath, StorageDriveEventType.Create),
    'the scoped drive create event'
  );
  yield* askSmokeAssert(
    scopedCreated.scope === scope,
    `scoped create event carried scope [${scopedCreated.scope}], expected [${scope}]`
  );
  yield* askSmokeAssert(
    scopedCreated.path === filepath,
    `scoped create event path [${scopedCreated.path}] was not scope-relative`
  );
  yield* askSmokeAssert(
    scopedCreated.ambientScope === scope,
    'scoped create handler did not run under the event scope'
  );

  yield* askFileDelete(SMOKE_SCOPED_PROBE_DRIVE, [filepath], scope);

  const scopedDeleted = yield* askSmokePollForMarker(
    smokeFileEventMarkerId(filepath, StorageDriveEventType.Delete),
    'the scoped drive delete event'
  );
  yield* askSmokeAssert(
    scopedDeleted.scope === scope && scopedDeleted.path === filepath,
    'scoped delete event did not carry the scope and scope-relative path'
  );
}
