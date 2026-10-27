import { QpqPermission } from '../../permission/types/QpqPermission';

/** A named bundle of permission keys. Roles bundle keys only, never selectors; narrowing to resources is a per-member grant. */
export type TenantRoleDefinition = {
  code: string;
  name: string;
  // One sentence for a role picker: what holding this lets a person do.
  description?: string;
  permissions: QpqPermission[];
};
