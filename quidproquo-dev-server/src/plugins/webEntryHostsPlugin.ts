import { webEntryHostsImplementation } from '../implementations/webEntryHostsImplementation';
import { DevServerPlugin } from './types/DevServerPlugin';

// One static server per ported web entry (docs and the like) when serving pre-built web.
export const webEntryHostsPlugin: DevServerPlugin = {
  name: 'web entry http servers',
  start: webEntryHostsImplementation,
};
