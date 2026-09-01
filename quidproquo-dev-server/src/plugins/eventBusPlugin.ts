import { eventBusImplementation } from '../implementations/eventBusImplementation';
import { DevServerPlugin } from './types/DevServerPlugin';

// See the note in eventBusImplementation: currently a no-op.
export const eventBusPlugin: DevServerPlugin = {
  name: 'event bus',
  start: eventBusImplementation,
};
