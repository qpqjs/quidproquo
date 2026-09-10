import { askKeyValueStoreUpsert, AskResponse } from 'quidproquo-core';

import { TENANT_MEMBER_LINKS_STORE } from '../constants/tenantStoreNames';
import { TenantMemberLinks } from '../models/TenantMemberLinks';

export function* askTenantMemberLinksUpsert(links: TenantMemberLinks): AskResponse<void> {
  return yield* askKeyValueStoreUpsert<TenantMemberLinks>(TENANT_MEMBER_LINKS_STORE, links);
}
