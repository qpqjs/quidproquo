import { defineInlineFunction, defineKeyValueStore, QPQConfig } from 'quidproquo-core';
import { defineEmailReceiver } from 'quidproquo-webserver';

import { TENANT_EMAIL_ON_EMAIL_GLOBAL } from '../constants/tenantEmailGlobalNames';
import { tenantEmailOnEmailFunctionName } from '../constants/tenantEmailOnEmailFunctionName';
import { TENANT_EMAIL_INBOX_STORE } from '../constants/tenantEmailStoreNames';
import { TenantEmailInbox } from '../models/TenantEmailInbox';
import { defineTenantEmailRoutes } from '../routes/defineTenantEmailRoutes';
import { TenantedEmailReceiverOptions } from '../types/TenantedEmailReceiverOptions';

/**
 * A defineEmailReceiver whose messages are routed to tenants: a tenant registers addresses
 * (any free local part, global first come) through the routes at basePath, and `onEmail` runs
 * once per delivered registered recipient, inside that tenant's scope, with a
 * TenantedEmailReceivedEvent. Mail to an unregistered address is logged and dropped. Needs
 * defineTenant in the same service for the membership gate and the permission catalog
 * (TenantEmailPermission.InboxesManage).
 */
export const defineTenantedEmailReceiver = (name: string, options: TenantedEmailReceiverOptions): QPQConfig => {
  const onEmailFunctionName = tenantEmailOnEmailFunctionName(name);

  return [
    // Unscoped by necessity: a message names an inbox before any scope exists.
    defineKeyValueStore<TenantEmailInbox>(TENANT_EMAIL_INBOX_STORE, 'address', [], { indexes: ['tenantId'] }),

    defineInlineFunction(options.onEmail, { functionName: onEmailFunctionName }),

    defineEmailReceiver(name, {
      onEmail: {
        basePath: __dirname,
        relativePath: '../entry/inlineFunction/onTenantedEmail',
        functionName: 'onTenantedEmail',
        globals: { [TENANT_EMAIL_ON_EMAIL_GLOBAL]: onEmailFunctionName },
      },
    }),

    defineTenantEmailRoutes(options),
  ];
};
