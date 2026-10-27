import { fileWatcherImplementation } from '../implementations/fileWatcher';
import { DevServerPlugin } from './types/DevServerPlugin';

// Watches the storage drives and fires their onEvent handlers.
export const fileWatcherPlugin: DevServerPlugin = {
  name: 'file watcher',
  start: fileWatcherImplementation,
};
