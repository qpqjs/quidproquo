import { AskResponse } from '@qpqjs/core';
import { EmailReceivedEvent, EmailReceivedEventResponse } from '@qpqjs/webserver';

import { askTenantEmailRoute } from '../../logic/askTenantEmailRoute';

// The plain receiver's onEmail for a tenanted receiver: route the message to its tenants.
export function* onTenantedEmail({ message }: EmailReceivedEvent): AskResponse<EmailReceivedEventResponse> {
  yield* askTenantEmailRoute(message);
}
