import { createRouteDefinition } from '../../routes';
import { adminUserDirectoryResourceName } from './adminUserDirectory';

// Routes gated by the qpq admin user pool. The gateway verifies the JWT before
// the handler runs.
//
// TODO: @joecoady - enforce that all admin requests are masqueraded to the
// platform user id. createRouteDefinition only closures RouteOptions, so that
// will need a variant that also wraps `runtime` with askMasquerade (or a manual
// dynamicRoute wrapper).
export const qpqAdminAuthenticatedRoute = createRouteDefinition({
  routeAuthSettings: {
    userDirectoryName: adminUserDirectoryResourceName,
  },
});
