import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocParseBody } from '../../../eventDoc/routes/askEventDocParseBody';
import { askTenantEmailInboxRegister } from '../../logic/askTenantEmailInboxRegister';
import { askTenantEmailInboxView } from '../../logic/askTenantEmailInboxView';
import { TenantEmailInboxCreateRequest } from '../../models/TenantEmailInboxCreateRequest';
import { askTenantEmailRequest } from '../askTenantEmailRequest';

/** POST {basePath}: register an address (body `{ address, label? }`) for the tenant. Conflict when taken. */
export function* create(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { tenantId, userId } = yield* askTenantEmailRequest(event);

  const { address, label } = yield* askEventDocParseBody<TenantEmailInboxCreateRequest>(event);
  if (typeof address !== 'string') {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'An address is required.');
  }

  const inbox = yield* askTenantEmailInboxRegister(tenantId, userId, address, typeof label === 'string' ? label : '');
  const [view] = yield* askTenantEmailInboxView([inbox]);

  return qpqWebServerUtils.toJsonEventResponse(view);
}
