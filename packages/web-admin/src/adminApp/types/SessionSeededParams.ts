import { AdminSearchParams } from './AdminSearchParams';

// URL params captured at boot; folded straight into the initial session state so
// a deep link is part of the audit record.
export type SessionSeededParams = Partial<AdminSearchParams> & {
  tab?: number;
  correlation?: string;
};
