import { AskResponse, DecodedAccessToken, Nullable, StorySession } from 'quidproquo-core';

import { askRouteAuthValidationDecode, askRouteAuthValidationResolveContext, RouteAuthDecodeOutcome } from '../actions/routeAuthValidation';
import { RouteAuthSettings } from '../config/settings/route';
import { HTTPEvent } from '../types/HTTPEvent';
import { getAccessTokenFromHeaders } from '../utils/headerUtils';
import { unsafeDecodeJWTPayload } from '../utils/jwtUtils';

export interface GetHttpApiEventStorySessionPayload {
  event: HTTPEvent;
  routeAuthSettings?: RouteAuthSettings;
  session: StorySession;
}

// For the logs only: an unverified token on a route without token auth, marked wasValid: false.
const getUnverifiedAccessToken = (event: HTTPEvent): Nullable<DecodedAccessToken> => {
  const accessToken = getAccessTokenFromHeaders(event.headers);

  if (!accessToken) {
    return null;
  }

  const info = unsafeDecodeJWTPayload<{
    sub?: string;
    userId?: string;
    username?: string;
    id?: string;
    exp?: number;
  }>(accessToken);

  return {
    exp: info?.exp || 0,
    userDirectory: '',
    userId: info?.sub || info?.id || info?.userId || info?.username || '',
    username: info?.username || info?.userId || info?.sub || info?.id || '',
    wasValid: false,
  };
};

export function* askGetHttpApiEventStorySession({
  event,
  routeAuthSettings = {},
  session,
}: GetHttpApiEventStorySessionPayload): AskResponse<StorySession | undefined> {
  // Always yield the decode, mirroring askValidateRouteAuth, so a per-route
  // processor override's identity reaches the session. Auth already ran in the
  // auto-respond preamble, hence ignoreExpiration: true.
  const decodeResult = yield* askRouteAuthValidationDecode(event, routeAuthSettings, true);

  // Normally unreachable: an invalid request already 401'd in the preamble.
  if (decodeResult.outcome === RouteAuthDecodeOutcome.invalid) {
    return void 0;
  }

  const validatedAccessToken = decodeResult.outcome === RouteAuthDecodeOutcome.valid ? decodeResult.decodedAccessToken : null;

  // Errors propagate and fail the request: a context the override refused must
  // never fall back to running without it (a tenant check falling through to
  // personal scope, say).
  const resolvedContext = yield* askRouteAuthValidationResolveContext(event, routeAuthSettings, validatedAccessToken);

  const decodedAccessToken = validatedAccessToken || getUnverifiedAccessToken(event);
  const hasResolvedContext = Object.keys(resolvedContext).length > 0;

  if (!decodedAccessToken && !hasResolvedContext) {
    return void 0;
  }

  return {
    ...session,

    ...(decodedAccessToken ? { decodedAccessToken } : {}),
    context: { ...session.context, ...resolvedContext },
  };
}
