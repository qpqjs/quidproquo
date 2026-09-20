import { DynamicRouteConfig } from '../../routes/DynamicRouteConfig';
import { TenantRoutePermission } from '../models/TenantRoutePermission';

/** A tenanted route's config: the dynamic-route config plus the permission the caller must hold. Omitted means membership only. */
export type TenantedRouteConfig<TBody = undefined, TQuery = undefined> = DynamicRouteConfig<TBody, TQuery> & {
  permission?: TenantRoutePermission;
};
