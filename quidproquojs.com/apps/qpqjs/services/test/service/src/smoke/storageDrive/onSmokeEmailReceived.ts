import {
  askEmailParse,
  askFileReadBinaryContents,
  askKeyValueStoreUpsert,
  AskResponse,
  StorageDriveEvent,
  StorageDriveEventResponse,
} from 'quidproquo';

import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

import { smokeEmailMarkerId } from './smokeEmailMarkerId';

// Fan-in for the email test: every object the receiver writes is one raw
// message. It is parsed here and a marker written per delivered recipient,
// carrying the subject and the provider's SPF/DKIM verdicts so the test can
// check the message came through intact and authenticated.
export function* onSmokeEmailReceived(
  event: StorageDriveEvent
): AskResponse<StorageDriveEventResponse> {
  for (const filepath of event.filePaths) {
    const raw = yield* askFileReadBinaryContents(event.driveName, filepath);
    const message = yield* askEmailParse(raw.base64Data);

    for (const recipient of message.recipients) {
      const marker: SmokeProbeRecord = {
        probeId: smokeEmailMarkerId(recipient),
        category: 'email',
        value: 1,
        path: message.subject,
        authentication: [
          message.authentication.spf,
          message.authentication.dkim,
        ].join('/'),
      };

      yield* askKeyValueStoreUpsert<SmokeProbeRecord>(
        SMOKE_PROBE_STORE,
        marker
      );
    }
  }
}
