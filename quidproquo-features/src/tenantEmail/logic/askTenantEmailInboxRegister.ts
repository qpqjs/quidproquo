import { askDateNow, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { TenantId } from '../../tenant/models/TenantId';
import { askTenantEmailInboxInsert } from '../data/askTenantEmailInboxInsert';
import { TenantEmailInbox } from '../models/TenantEmailInbox';
import { normaliseEmailLocalPart } from './normaliseEmailLocalPart';

/**
 * Registers an address for a tenant. BadRequest for a malformed local part; Conflict when the
 * address is already held (by anyone: addresses are global across tenants, first come).
 */
export function* askTenantEmailInboxRegister(tenantId: TenantId, userId: string, address: string, label: string): AskResponse<TenantEmailInbox> {
  const normalised = normaliseEmailLocalPart(address);
  if (normalised === null) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, `[${address}] is not a valid email local part.`);
  }

  const createdAt = yield* askDateNow();
  const inbox: TenantEmailInbox = { address: normalised, tenantId, label, createdAt, createdByUserId: userId };

  yield* askTenantEmailInboxInsert(inbox);

  return inbox;
}
