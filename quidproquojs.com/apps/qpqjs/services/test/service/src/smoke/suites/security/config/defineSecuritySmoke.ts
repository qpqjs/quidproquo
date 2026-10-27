import { defineDynamicRoutes } from '@qpqjs/features';
import { QPQConfig } from 'quidproquo';

import * as controllers from '../controller';

/** The public routes the security probes call over HTTP. The path literal is the controller folder under the service's src root. */
export const defineSecuritySmoke = (): QPQConfig =>
  defineDynamicRoutes(controllers, '/smoke/suites/security/controller');
