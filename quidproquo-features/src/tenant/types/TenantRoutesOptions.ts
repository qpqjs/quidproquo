import { CrossModuleOwner } from 'quidproquo-core';
import { RouteAuthSettings } from 'quidproquo-webserver';

import { TenantRolesOptions } from './TenantRolesOptions';

export type TenantRoutesOptions = {
  // The tenant collection root: the stock eventDoc CRUD mounts here, named after
  // the model type ('tenant' -> '/tenants') like every other collection.
  basePath: `/${string}`;
  // Root of the membership-gated routes (list mine / create / read the published
  // record / read its logo). Every one of them checks the caller's membership,
  // which is why they read as "my tenants" rather than as the collection.
  //
  // Must NOT be a child of basePath: `${basePath}/{id}` matches any single
  // segment, so `${basePath}/mine` would be indistinguishable from the tenant
  // whose id is 'mine' and the router would pick by path-length precedence.
  myTenantsBasePath: `/${string}`;
  // Tenant routes are meaningless unauthenticated - membership keys off the user.
  routeAuthSettings: RouteAuthSettings;
  version?: number;
  // Header the client sends its selected tenant id on. Defaults to x-qpq-tenant-id.
  tenantHeaderName?: string;
};

export type TenantOptions = TenantRoutesOptions & {
  // The service that owns the tenant registry. The stores, publish sync and
  // management routes only materialise on that service's deploy; every other
  // service gets just the scope resolver + a cross-module ref to the membership
  // table. Declare defineTenant identically in every service, passing the same
  // owner, and let the deploy decide what materialises. `module` is required -
  // it names the owning service the registry is gated to.
  owner: CrossModuleOwner & { module: string };
  // The app's roles. Omitted means the catalog is just the built-in tenantAdmin.
  roles?: TenantRolesOptions;
};
