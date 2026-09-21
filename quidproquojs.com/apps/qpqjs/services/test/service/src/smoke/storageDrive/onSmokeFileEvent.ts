import {
  askKeyValueStoreUpsert,
  AskResponse,
  askStorageScopeRead,
  StorageDriveEvent,
  StorageDriveEventResponse,
} from 'quidproquo';

import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

import { smokeFileEventMarkerId } from './smokeFileEventMarkerId';

// Fan-in for the file event test: both the scoped and the unscoped event
// drive point create and delete here. The marker records what the event
// carried and the scope the handler ran under, so the test can check that a
// scoped drive's event arrives with its scope split off the path and the
// handler re-entered that scope.
export function* onSmokeFileEvent(
  event: StorageDriveEvent
): AskResponse<StorageDriveEventResponse> {
  const ambientScope = yield* askStorageScopeRead();

  for (const filepath of event.filePaths) {
    const marker: SmokeProbeRecord = {
      probeId: smokeFileEventMarkerId(filepath, event.eventType),
      category: 'fileEvent',
      value: 1,
      scope: event.scope,
      ambientScope: ambientScope ?? undefined,
      path: filepath,
    };

    // The probe store is unscoped, so the marker is written without a scope
    // whatever scope this handler runs under.
    yield* askKeyValueStoreUpsert<SmokeProbeRecord>(SMOKE_PROBE_STORE, marker);
  }
}
