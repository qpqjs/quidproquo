import { TenantId } from '../../tenant/models/TenantId';

/** One address a tenant receives on. `address` is the local part, lower-cased; the host is the app's receiving domain. */
export type TenantEmailInbox = {
  address: string;
  tenantId: TenantId;
  // Free text the tenant uses to tell its inboxes apart.
  label: string;
  createdAt: string;
  createdByUserId: string;
};
