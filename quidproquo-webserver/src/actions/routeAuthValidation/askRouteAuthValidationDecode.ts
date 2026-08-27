import { createActionRequester } from 'quidproquo-core';

import { RouteAuthSettings } from '../../config/settings/route';
import { HTTPEvent } from '../../types/HTTPEvent';
import { RouteAuthDecodeResult } from './RouteAuthDecodeResult';
import { RouteAuthValidationActionType } from './RouteAuthValidationActionType';

export interface RouteAuthValidationDecodeActionPayload {
  event: HTTPEvent;
  routeAuthSettings: RouteAuthSettings;
  ignoreExpiration: boolean;
}

export const askRouteAuthValidationDecode = createActionRequester<RouteAuthDecodeResult>()({
  actionType: RouteAuthValidationActionType.Decode,
  getPayload: (event: HTTPEvent, routeAuthSettings: RouteAuthSettings, ignoreExpiration: boolean) => ({ event, routeAuthSettings, ignoreExpiration }),
});
