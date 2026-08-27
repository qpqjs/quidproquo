import { AskResponse, StorySession } from 'quidproquo-core';

import { askRouteAuthValidationDecode, RouteAuthDecodeOutcome } from '../actions/routeAuthValidation';
import { RouteAuthSettings } from '../config/settings/route';
import { HTTPEvent } from '../types/HTTPEvent';
import { getAccessTokenFromHeaders } from '../utils/headerUtils';
import { unsafeDecodeJWTPayload } from '../utils/jwtUtils';

export interface GetHttpApiEventStorySessionPayload {
  event: HTTPEvent;
  routeAuthSettings?: RouteAuthSettings;
  session: StorySession;
}

export function* askGetHttpApiEventStorySession({
  event,
  routeAuthSettings,
  session,
}: GetHttpApiEventStorySessionPayload): AskResponse<StorySession | undefined> {
  // Always yield the decode, mirroring askValidateRouteAuth, so a per-route
  // processor override's identity reaches the session. Auth already ran in the
  // auto-respond preamble, hence ignoreExpiration: true.
  const decodeResult = yield* askRouteAuthValidationDecode(event, routeAuthSettings || {}, true);

  if (decodeResult.outcome === RouteAuthDecodeOutcome.valid) {
    return {
      ...session,

      decodedAccessToken: decodeResult.decodedAccessToken,
    };
  }

  // Normally unreachable: an invalid request already 401'd in the preamble.
  if (decodeResult.outcome === RouteAuthDecodeOutcome.invalid) {
    return void 0;
  }

  // Not applicable: no token auth configured for this route. If an access token
  // was sent anyway, extract info for the logs only, marked wasValid: false.
  const accessToken = getAccessTokenFromHeaders(event.headers);

  if (!accessToken) {
    return void 0;
  }

  const info = unsafeDecodeJWTPayload<{
    sub?: string;
    userId?: string;
    username?: string;
    id?: string;
    exp?: number;
  }>(accessToken);

  return {
    ...session,

    decodedAccessToken: {
      exp: info?.exp || 0,
      userDirectory: '',
      userId: info?.sub || info?.id || info?.userId || info?.username || '',
      username: info?.username || info?.userId || info?.sub || info?.id || '',
      wasValid: false,
    },
  };
}
