import { QpqFunctionRuntime } from 'quidproquo-core';
import { RouteAuthSettings } from 'quidproquo-webserver';

export type TenantedEmailReceiverOptions = {
  // Runs once per (message, registered recipient) with a TenantedEmailReceivedEvent, inside the tenant's scope.
  onEmail: QpqFunctionRuntime;
  // Root of the inbox routes (list / register / delete), membership-gated and permission-checked.
  basePath: `/${string}`;
  routeAuthSettings: RouteAuthSettings;
  version?: number;
};
