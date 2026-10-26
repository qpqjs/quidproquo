import {
  askCatch,
  AskResponse,
  askUserDirectoryReadAccessToken,
  HTTPEventResponse,
  qpqWebServerUtils,
} from 'quidproquo';
import { dynamicRoute } from 'quidproquo-features';

// GET /security/who-am-i-lax. Public, no token auth, and the read ignores expiry
// the way a refresh flow does. Reports the identity the platform hands a story
// that asks that way; a forged bearer must still come back as an error.
export const whoAmILax = dynamicRoute(
  ['GET', '/security/who-am-i-lax'],
  function* (): AskResponse<HTTPEventResponse> {
    const token = yield* askCatch(
      askUserDirectoryReadAccessToken('smoke-no-directory', true)
    );

    return qpqWebServerUtils.toJsonEventResponse(
      token.success
        ? { userId: token.result.userId }
        : { error: token.error.errorType }
    );
  }
);
