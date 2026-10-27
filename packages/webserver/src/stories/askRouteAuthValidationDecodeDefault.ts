import { askCatch, AskResponse, askUserDirectoryDecodeAccessToken } from 'quidproquo-core';

import { RouteAuthDecodeOutcome, RouteAuthDecodeResult, RouteAuthValidationDecodeActionPayload } from '../actions/routeAuthValidation';
import { getHeaderValue } from '../utils/headerUtils';

export function* askRouteAuthValidationDecodeDefault({
  event,
  routeAuthSettings,
  ignoreExpiration,
}: RouteAuthValidationDecodeActionPayload): AskResponse<RouteAuthDecodeResult> {
  // No user directory means the route has no token auth under the default
  // processor: not applicable, the request passes as anonymous. A per-route
  // override that implements its own auth never reaches this story.
  if (!routeAuthSettings.userDirectoryName) {
    return { outcome: RouteAuthDecodeOutcome.notApplicable };
  }

  const authHeader = getHeaderValue('Authorization', event.headers);
  if (!authHeader) {
    return { outcome: RouteAuthDecodeOutcome.invalid };
  }

  const [authType, accessToken] = authHeader.split(' ');
  if (authType !== 'Bearer' || !accessToken) {
    return { outcome: RouteAuthDecodeOutcome.invalid };
  }

  const result = yield* askCatch(askUserDirectoryDecodeAccessToken(routeAuthSettings.userDirectoryName, ignoreExpiration, accessToken));

  if (!result.success || !result.result.wasValid) {
    return { outcome: RouteAuthDecodeOutcome.invalid };
  }

  return { outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: result.result };
}
