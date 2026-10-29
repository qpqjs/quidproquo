import {
  askNetworkRequest,
  askOpenApiGetDocument,
  AskResponse,
} from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

type WhoAmIBody = { userId?: string; error?: string };

const base64Url = (value: object): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

// Checklist item: access token decode. A route without token auth records an
// unverified decode of any bearer header for the logs. A story on that route
// must never be handed that decode as an identity: an unsigned token naming
// another user must come back as an error, not as that user.
export function* askRunUnverifiedBearerTest(): AskResponse<void> {
  const document = yield* askOpenApiGetDocument();
  const baseUrl = document.servers[0]?.url;
  yield* askSmokeAssert(!!baseUrl, 'document lists no servers to call');

  const forged = `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url({
    sub: 'victim-user-id',
    username: 'victim',
    token_use: 'access',
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.forged`;

  const response = yield* askNetworkRequest<WhoAmIBody, undefined>(
    'GET',
    `${baseUrl}/v1/security/who-am-i`,
    {
      headers: { Authorization: `Bearer ${forged}` },
    }
  );

  yield* askSmokeAssert(
    response.status === 200,
    `who-am-i returned [${response.status}], expected 200`
  );
  yield* askSmokeAssert(
    response.data.userId !== 'victim-user-id',
    `a forged bearer token was handed to the story as the identity [${JSON.stringify(response.data)}]`
  );
}
