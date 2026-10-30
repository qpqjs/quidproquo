import { dynamicRoute } from '@qpqjs/features';
import { askCatch, AskResponse, askUserDirectoryReadAccessToken, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo';

// GET /security/who-am-i. Public, no token auth. Reports the identity the
// platform hands a story on a route like this. The directory name is a
// placeholder: a session-cached token never needs the directory, which is
// exactly what the probe is about.
export const whoAmI = dynamicRoute(['GET', '/security/who-am-i'], function* (): AskResponse<HTTPEventResponse> {
  const token = yield* askCatch(askUserDirectoryReadAccessToken('smoke-no-directory', false));

  return qpqWebServerUtils.toJsonEventResponse(token.success ? { userId: token.result.userId } : { error: token.error.errorType });
});
