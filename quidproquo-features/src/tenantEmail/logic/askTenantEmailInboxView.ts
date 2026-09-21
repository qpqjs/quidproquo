import { AskResponse } from 'quidproquo-core';
import { askEmailReceivingHosts } from 'quidproquo-webserver';

import { TenantEmailInbox } from '../models/TenantEmailInbox';
import { TenantEmailInboxView } from '../models/TenantEmailInboxView';

/** Rows with their full addresses on every receiving host, for the routes. */
export function* askTenantEmailInboxView(inboxes: TenantEmailInbox[]): AskResponse<TenantEmailInboxView[]> {
  const hosts = yield* askEmailReceivingHosts();

  return inboxes.map((inbox) => ({ ...inbox, addresses: hosts.map((host) => `${inbox.address}@${host}`) }));
}
