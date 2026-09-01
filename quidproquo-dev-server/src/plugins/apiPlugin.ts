import { apiImplementation } from '../implementations/apiImplementation';
import { DevServerPlugin } from './types/DevServerPlugin';

// The express server serving every service's routes.
export const apiPlugin: DevServerPlugin = {
  name: 'api http server',
  start: apiImplementation,
};
