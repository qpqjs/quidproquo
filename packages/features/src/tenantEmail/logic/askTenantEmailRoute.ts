import { askConfigGetGlobal, askInlineFunctionExecute, askLog, AskResponse, askStorageScopeProvide } from 'quidproquo-core';
import { EmailMessage } from 'quidproquo-webserver';

import { composeTenantScope } from '../../tenant/logic/storageScope';
import { TENANT_EMAIL_ON_EMAIL_GLOBAL } from '../constants/tenantEmailGlobalNames';
import { askTenantEmailInboxGet } from '../data/askTenantEmailInboxGet';
import { TenantedEmailReceivedEvent, TenantedEmailReceivedEventResponse } from '../types/TenantedEmailReceivedEvent';
import { normaliseEmailLocalPart } from './normaliseEmailLocalPart';

/**
 * Routes one received message to its tenants: per delivered recipient, the registered inbox
 * names the tenant, and the app's onEmail runs inside that tenant's scope. An unregistered
 * recipient is logged and skipped, never thrown: a stray message must not retry-loop.
 */
export function* askTenantEmailRoute(message: EmailMessage): AskResponse<void> {
  const onEmailFunctionName = yield* askConfigGetGlobal<string>(TENANT_EMAIL_ON_EMAIL_GLOBAL);

  for (const recipient of message.recipients) {
    const address = normaliseEmailLocalPart(recipient);
    const inbox = address === null ? null : yield* askTenantEmailInboxGet(address);

    if (!inbox) {
      yield* askLog`tenant email: no inbox registered for [${recipient}], message [${message.messageId ?? '?'}] dropped`;
      continue;
    }

    const event: TenantedEmailReceivedEvent = { message, recipient, inbox };

    yield* askStorageScopeProvide(
      composeTenantScope(inbox.tenantId),
      askInlineFunctionExecute<TenantedEmailReceivedEventResponse, TenantedEmailReceivedEvent>(onEmailFunctionName, event),
    );
  }
}
