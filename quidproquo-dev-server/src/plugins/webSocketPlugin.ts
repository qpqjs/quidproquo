import { webSocketImplementation } from '../implementations/webSocket';
import { DevServerPlugin } from './types/DevServerPlugin';

// The websocket servers, and the http server they upgrade from.
export const webSocketPlugin: DevServerPlugin = {
  name: 'websocket servers',
  start: webSocketImplementation,
};
