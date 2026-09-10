import { askKeyValueStoreGet, AskResponse } from 'quidproquo-core';

import { TENANT_MEMBER_LINKS_STORE } from '../constants/tenantStoreNames';
import { TenantMemberLinks } from '../models/TenantMemberLinks';

export function* askTenantMemberLinksGet(tenantId: string): AskResponse<TenantMemberLinks | null> {
  return yield* askKeyValueStoreGet<TenantMemberLinks>(TENANT_MEMBER_LINKS_STORE, tenantId);
}
