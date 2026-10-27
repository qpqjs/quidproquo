import { AskResponse } from '@qpqjs/core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from '@qpqjs/webserver';

import { askTenantEmailInboxesForTenant } from '../../data/askTenantEmailInboxesForTenant';
import { askTenantEmailInboxView } from '../../logic/askTenantEmailInboxView';
import { askTenantEmailRequest } from '../askTenantEmailRequest';

/** GET {basePath}: the tenant's inboxes with their full addresses. */
export function* list(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { tenantId } = yield* askTenantEmailRequest(event);

  const inboxes = yield* askTenantEmailInboxesForTenant(tenantId);

  return qpqWebServerUtils.toJsonEventResponse(yield* askTenantEmailInboxView(inboxes));
}
