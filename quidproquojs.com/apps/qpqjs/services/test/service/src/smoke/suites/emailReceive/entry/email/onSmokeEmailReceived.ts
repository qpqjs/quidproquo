import {
  askKeyValueStoreUpsert,
  AskResponse,
  EmailReceivedEvent,
  EmailReceivedEventResponse,
} from 'quidproquo';

import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

import { smokeEmailMarkerId } from '../../logic/smokeEmailMarkerId';

// The smoke receiver's onEmail: one marker per delivered recipient, carrying
// the subject and the provider's SPF/DKIM verdicts so the test can check the
// message came through intact and authenticated.
export function* onSmokeEmailReceived({
  message,
}: EmailReceivedEvent): AskResponse<EmailReceivedEventResponse> {
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

    yield* askKeyValueStoreUpsert<SmokeProbeRecord>(SMOKE_PROBE_STORE, marker);
  }
}
