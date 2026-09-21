import {
  askDelay,
  askKeyValueStoreDelete,
  askKeyValueStoreGet,
  AskResponse,
  Nullable,
} from 'quidproquo';

import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

import { askSmokeAssert } from './askSmokeAssert';

const POLL_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;

// Fan-in for every async probe: polls the probe store for the marker row an
// event handler writes, fails the test if it never arrives, and removes it
// so a rerun starts clean. The default wait covers the dev server's file
// watcher settle window and S3 / stream delivery latency; a slower path
// (mail delivery) asks for more attempts.
export function* askSmokePollForMarker(
  markerId: string,
  via: string,
  attempts: number = POLL_ATTEMPTS
): AskResponse<SmokeProbeRecord> {
  let marker: Nullable<SmokeProbeRecord> = null;
  for (let attempt = 0; attempt < attempts && !marker; attempt += 1) {
    yield* askDelay(POLL_INTERVAL_MS);
    marker = yield* askKeyValueStoreGet<SmokeProbeRecord>(
      SMOKE_PROBE_STORE,
      markerId
    );
  }

  yield* askSmokeAssert(
    !!marker,
    `marker [${markerId}] never arrived via ${via}`
  );

  yield* askKeyValueStoreDelete(SMOKE_PROBE_STORE, markerId);

  return marker!;
}
