import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocProvideRequestScope } from '../../../eventDoc/globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../../eventDoc/globals/askEventDocProvideStoreFromGlobals';
import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askTenantListForUser } from '../../logic/askTenantListForUser';

function* askTenantRouteList(): AskResponse<HTTPEventResponse> {
  const userId = yield* askEventDocResolveUserId();
  const summaries = yield* askTenantListForUser(userId);
  return qpqWebServerUtils.toJsonEventResponse(summaries);
}

/**
 * GET {basePath}: the authenticated user's tenants as EventDocSummary rows. Runs under the
 * request's scope so memberships homed in the caller's current partition hydrate from the
 * live summary (drafts included); the rest hydrate from the published registry record.
 */
export function* list(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askTenantRouteList()));
}
