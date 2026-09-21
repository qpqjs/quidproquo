import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askTenantEmailInboxRelease } from '../../logic/askTenantEmailInboxRelease';
import { askTenantEmailRequest } from '../askTenantEmailRequest';

/** DELETE {basePath}/{address}: release an address the tenant holds. */
export function* remove(event: HTTPEvent, params: { address: string }): AskResponse<HTTPEventResponse> {
  const { tenantId } = yield* askTenantEmailRequest(event);

  yield* askTenantEmailInboxRelease(tenantId, decodeURIComponent(params.address));

  return qpqWebServerUtils.toJsonEventResponse({ ok: true });
}
