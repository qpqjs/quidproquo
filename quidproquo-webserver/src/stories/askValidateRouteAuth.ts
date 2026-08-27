import { AskResponse } from 'quidproquo-core';

import { askApiKeyValidationValidate } from '../actions/apiKeyValidation';
import { askRouteAuthValidationDecode, RouteAuthDecodeOutcome } from '../actions/routeAuthValidation';
import { RouteAuthSettings } from '../config/settings/route';
import { HTTPEvent } from '../types/HTTPEvent';
import { getHeaderValue } from '../utils/headerUtils';

export interface ValidateRouteAuthPayload {
  event: HTTPEvent;
  routeAuthSettings?: RouteAuthSettings;
}

export function* askValidateRouteAuth({ event, routeAuthSettings }: ValidateRouteAuthPayload): AskResponse<boolean> {
  if (!routeAuthSettings) {
    return true;
  }

  // Token auth via the swappable decode action: always yielded, so a per-route
  // processor override can implement completely custom auth. The default
  // processor keeps the user-directory check internally and returns
  // notApplicable when the route has no token auth configured.
  const decodeResult = yield* askRouteAuthValidationDecode(event, routeAuthSettings, false);
  if (decodeResult.outcome === RouteAuthDecodeOutcome.invalid) {
    return false;
  }

  // API key validation via action, composing with AND semantics
  const apiKeys = routeAuthSettings.apiKeys || [];
  if (apiKeys.length > 0) {
    const apiKeyHeader = getHeaderValue('x-api-key', event.headers);
    if (!apiKeyHeader) {
      return false;
    }

    const valid = yield* askApiKeyValidationValidate(apiKeyHeader, apiKeys);
    if (!valid) {
      return false;
    }
  }

  return true;
}
