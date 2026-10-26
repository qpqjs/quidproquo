import {
  askNetworkRequest,
  askOpenApiGetDocument,
  AskResponse,
} from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

type WhoAmIBody = { userId?: string; error?: string };

const base64Url = (value: object): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

// Checklist item: the http story session. An unsigned bearer with no exp claim
// decodes to exp 0, which is "expired" by every clock. A story that reads the
// session token ignoring expiry (a refresh flow does) must still be refused it:
// the signature was never checked, so it is nobody's identity.
export function* askRunUnverifiedBearerNoExpiryTest(): AskResponse<void> {
  const document = yield* askOpenApiGetDocument();
  const baseUrl = document.servers[0]?.url;
  yield* askSmokeAssert(!!baseUrl, 'document lists no servers to call');

  const forged = `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url({
    sub: 'victim-user-id',
    username: 'victim',
    token_use: 'access',
  })}.forged`;

  const response = yield* askNetworkRequest<undefined, WhoAmIBody>(
    'GET',
    `${baseUrl}/v1/security/who-am-i-lax`,
    {
      headers: { Authorization: `Bearer ${forged}` },
    }
  );
  yield* askSmokeAssert(
    response.status === 200,
    `who-am-i-lax returned [${response.status}], expected 200`
  );
  yield* askSmokeAssert(
    response.data.userId !== 'victim-user-id',
    `a forged bearer token without an exp claim was handed to the story as the identity [${JSON.stringify(response.data)}]`
  );
}
