import { kvsStreamImplementation } from '../implementations/kvsStreamImplementation';
import { DevServerPlugin } from './types/DevServerPlugin';

// Runs the stream handlers that project key-value store writes.
export const kvsStreamPlugin: DevServerPlugin = {
  name: 'kvs stream',
  start: kvsStreamImplementation,
};
