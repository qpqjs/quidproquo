import { QPQConfig } from 'quidproquo';
import { defineDynamicRoutes } from 'quidproquo-features';

import * as controllers from '../controller';

/**
 * The public echo route the openApi tests read back from the document and
 * call over HTTP. The routes carry their own method/path/schema on the
 * handler; this registers the controller module by its path under the
 * service's src root, so the literal must follow this folder if it moves.
 */
export const defineOpenApiSmoke = (): QPQConfig =>
  defineDynamicRoutes(controllers, '/smoke/suites/openApi/controller');
