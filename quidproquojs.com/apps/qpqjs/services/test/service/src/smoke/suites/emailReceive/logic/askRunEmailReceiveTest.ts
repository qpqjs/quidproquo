import { askDnsResolveHosts, askEmailSendEmail, AskResponse } from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { askSmokePollForMarker } from '../../../harness/assert/askSmokePollForMarker';
import { smokeEmailMarkerId } from './smokeEmailMarkerId';

// The inbound email path end to end: send to this app's own receiving domain
// with its own sender, SES receives it through the account rule set and the
// app's rule, the receiver parses it and hands it to onSmokeEmailReceived,
// which writes the marker. Deployed only: nothing receives mail locally.
export function* askRunEmailReceiveTest(runId: string): AskResponse<void> {
  const [receivingHost] = yield* askDnsResolveHosts({ subdomain: 'inbox' });
  const [siteHost] = yield* askDnsResolveHosts();

  const recipient = `${runId}@${receivingHost}`;
  const subject = `smoke ${runId}`;

  yield* askEmailSendEmail({
    from: `smoke@${siteHost}`,
    to: [recipient],
    subject,
    bodyText: `smoke probe ${runId}`,
  });

  // Mail delivery is the slowest path in the suite: SES receives, scans and
  // writes to S3 before the drive event fires.
  const marker = yield* askSmokePollForMarker(
    smokeEmailMarkerId(recipient),
    'the inbound email path',
    45
  );

  yield* askSmokeAssert(
    marker.path === subject,
    `received subject [${marker.path}] did not match [${subject}]`
  );
  yield* askSmokeAssert(
    marker.authentication === 'pass/pass',
    `received message was not authenticated: spf/dkim [${marker.authentication}]`
  );
}
