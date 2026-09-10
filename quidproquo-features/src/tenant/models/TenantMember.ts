import { Nullable } from 'quidproquo-core';

// A tenant member as the management UI lists it: the membership userId hydrated
// with the user directory's email + display name (null when the directory no
// longer knows the user, e.g. a deleted account whose link was never cleaned up).
export type TenantMember = {
  userId: string;
  email: Nullable<string>;
  name: Nullable<string>;
};
