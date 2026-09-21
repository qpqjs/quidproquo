import { TenantClientTarget } from '../../models/TenantClientTarget';

/** A route under `myTenantsBasePath` as the client addresses it; the only place the path shape is written down. */
export const tenantMyTenantsEndpoint = (target: TenantClientTarget, path: string = ''): string =>
  `/v${target.version ?? 1}${target.myTenantsBasePath}${path}`;
