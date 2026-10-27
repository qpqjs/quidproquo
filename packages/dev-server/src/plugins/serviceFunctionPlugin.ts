import { serviceFunctionImplementation } from '../implementations/serviceFunctionImplementation';
import { DevServerPlugin } from './types/DevServerPlugin';

// Executes cross-service function calls over the event bus.
export const serviceFunctionPlugin: DevServerPlugin = {
  name: 'service functions',
  start: serviceFunctionImplementation,
};
