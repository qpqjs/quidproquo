import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { TenantId } from '../../tenant/models/TenantId';
import { askTenantEmailInboxDelete } from '../data/askTenantEmailInboxDelete';
import { askTenantEmailInboxGet } from '../data/askTenantEmailInboxGet';
import { normaliseEmailLocalPart } from './normaliseEmailLocalPart';

/** Releases an address the tenant holds. NotFound when it is not registered, or is held by another tenant. */
export function* askTenantEmailInboxRelease(tenantId: TenantId, address: string): AskResponse<void> {
  const normalised = normaliseEmailLocalPart(address);
  const inbox = normalised === null ? null : yield* askTenantEmailInboxGet(normalised);

  // Another tenant's inbox reads as absent: an address is not evidence it is taken.
  if (!inbox || inbox.tenantId !== tenantId) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `No inbox [${address}] in this tenant.`);
  }

  yield* askTenantEmailInboxDelete(inbox.address);
}
