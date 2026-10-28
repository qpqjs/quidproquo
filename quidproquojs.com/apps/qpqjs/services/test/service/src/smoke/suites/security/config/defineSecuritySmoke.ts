import { QPQJS_USER_DIRECTORY, QpqjsServiceEnum } from '@qpqjs/constants';
import { defineDynamicRoutes, defineTenant } from '@qpqjs/features';
import { QPQConfig } from 'quidproquo';

import * as controllers from '../controller';

/**
 * The public routes the security probes call over HTTP, plus the tenant feature
 * (owned by this service) so the tenant isolation probe has a real membership
 * table to check against. The path literal is the controller folder under the
 * service's src root.
 */
export const defineSecuritySmoke = (): QPQConfig => [
  defineDynamicRoutes(controllers, '/smoke/suites/security/controller'),
  defineTenant({
    owner: { module: QpqjsServiceEnum.Test },
    basePath: '/security/tenants',
    myTenantsBasePath: '/security/my-tenants',
    routeAuthSettings: { userDirectoryName: QPQJS_USER_DIRECTORY },
  }),
];
