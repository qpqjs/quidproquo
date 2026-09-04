import { QPQConfig } from 'quidproquo';
import { defineDynamicRoutes } from 'quidproquo-features';

import * as controllers from '../controller';

// The echo routes carry their own method/path/schema on the handler; this just
// registers the controller module under the service's src root.
export const defineEcho = (): QPQConfig =>
  defineDynamicRoutes(controllers, '/echo/controller');
