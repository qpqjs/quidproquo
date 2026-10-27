import { Nullable, QpqIsoDateTime } from 'quidproquo-core';

/** A membership row as the management UI lists it, hydrated with the directory's email + name (null when the directory no longer knows the user). */
export type TenantMember = {
  userId: string;
  email: Nullable<string>;
  name: Nullable<string>;
  roles: string[];
  disabled: boolean;
  joinedAt: QpqIsoDateTime;
};
