import { EmailMessage } from 'quidproquo-webserver';

import { TenantEmailInbox } from '../models/TenantEmailInbox';

/**
 * What a defineTenantedEmailReceiver's onEmail receives, once per delivered recipient that is
 * a registered inbox, inside that inbox's tenant scope.
 */
export type TenantedEmailReceivedEvent = {
  message: EmailMessage;
  // The delivered address this run is for; a message to two inboxes runs twice.
  recipient: string;
  inbox: TenantEmailInbox;
};

export type TenantedEmailReceivedEventResponse = void;
