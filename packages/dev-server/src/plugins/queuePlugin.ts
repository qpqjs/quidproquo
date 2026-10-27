import { queueImplementation } from '../implementations/queueImplementation';
import { DevServerPlugin } from './types/DevServerPlugin';

// Runs queue messages, including the FIFO group serialisation.
export const queuePlugin: DevServerPlugin = {
  name: 'queue',
  start: queueImplementation,
};
