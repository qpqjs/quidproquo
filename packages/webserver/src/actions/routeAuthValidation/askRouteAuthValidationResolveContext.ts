import { createActionRequester, DecodedAccessToken, Nullable, QpqContext } from '@qpqjs/core';

import { RouteAuthSettings } from '../../config/settings/route';
import { HTTPEvent } from '../../types/HTTPEvent';
import { RouteAuthValidationActionType } from './RouteAuthValidationActionType';

/**
 * Resolves extra context (a tenant's storage scope, say) for an authenticated request. The default adds nothing;
 * a per-route processor override supplies it. An error rejects the request: 401 in the preamble, a failed request after.
 */
export const askRouteAuthValidationResolveContext = createActionRequester<QpqContext<unknown>>()({
  actionType: RouteAuthValidationActionType.ResolveContext,
  getPayload: (event: HTTPEvent, routeAuthSettings: RouteAuthSettings, decodedAccessToken: Nullable<DecodedAccessToken>) => ({
    event,
    routeAuthSettings,
    decodedAccessToken,
  }),
});
