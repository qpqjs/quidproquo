import { askNetworkRequest, askOpenApiGetDocument, AskResponse } from 'quidproquo';

import { EchoRequest, EchoResponse } from '@qpqjs/test-models';

import { askSmokeAssert } from '../askSmokeAssert';

// The public echo route over real HTTP, from the document's own servers entry,
// so the same test also proves that entry is a reachable base for this
// environment (the deployed api domain, or the dev server's mount path).
// The runId is the echoed value, so the response is provably this run's.
export function* askRunEchoRoundTripTest(runId: string): AskResponse<void> {
  const document = yield* askOpenApiGetDocument();
  const baseUrl = document.servers[0]?.url;
  yield* askSmokeAssert(!!baseUrl, 'document lists no servers to call');

  const valid: EchoRequest = { bodyValue: runId };
  const ok = yield* askNetworkRequest<EchoRequest, EchoResponse>(
    'POST',
    `${baseUrl}/v1/echo/${runId}`,
    { body: valid }
  );
  yield* askSmokeAssert(
    ok.status === 200,
    `echo returned [${ok.status}] for a valid body`
  );
  yield* askSmokeAssert(
    ok.data.pathValue === runId && ok.data.bodyValue === runId,
    `echo returned [${JSON.stringify(ok.data)}], expected both values to be [${runId}]`
  );

  // An empty bodyValue fails the min(1) on the schema; the route must 422, not 200
  const invalid = yield* askNetworkRequest<EchoRequest, unknown>(
    'POST',
    `${baseUrl}/v1/echo/${runId}`,
    { body: { bodyValue: '' } }
  );
  yield* askSmokeAssert(
    invalid.status === 422,
    `echo returned [${invalid.status}] for an invalid body, expected 422`
  );
}
