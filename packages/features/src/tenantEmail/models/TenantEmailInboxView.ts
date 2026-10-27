import { TenantEmailInbox } from './TenantEmailInbox';

/** An inbox as the routes return it: the row plus the full addresses on every receiving host. */
export type TenantEmailInboxView = TenantEmailInbox & {
  addresses: string[];
};
