import { QpqPermission } from '../../permission/types/QpqPermission';

/**
 * What a tenanted route requires: a bare key, or the object form when the route needs to say
 * more. `resourceIdParam` names the path param holding the resource id. `allowPersonalScope`
 * lets the route run ungated when the request carries no tenant header (safe only when the
 * handler touches nothing but scope-partitioned data; default is to refuse). `message`
 * replaces the default "Missing permission: <key>" refusal text.
 */
export type TenantRoutePermission =
  | QpqPermission
  | {
      permission: QpqPermission;
      resourceIdParam?: string;
      allowPersonalScope?: boolean;
      message?: string;
    };
