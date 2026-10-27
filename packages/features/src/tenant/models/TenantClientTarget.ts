/** Where a client finds the tenant routes: the owning service and the `myTenantsBasePath` it mounted them under. */
export type TenantClientTarget = {
  service: string;
  myTenantsBasePath: `/${string}`;
  version?: number;
};
