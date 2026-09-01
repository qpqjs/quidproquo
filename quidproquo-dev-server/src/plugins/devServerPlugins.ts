import { DevServerPlugin } from './types/DevServerPlugin';
import { apiPlugin } from './apiPlugin';
import { eventBusPlugin } from './eventBusPlugin';
import { fileStoragePlugin } from './fileStoragePlugin';
import { fileWatcherPlugin } from './fileWatcherPlugin';
import { inFlightPlugin } from './inFlightPlugin';
import { kvsPlugin } from './kvsPlugin';
import { kvsStreamPlugin } from './kvsStreamPlugin';
import { queuePlugin } from './queuePlugin';
import { schedulePlugin } from './schedulePlugin';
import { serviceFunctionPlugin } from './serviceFunctionPlugin';
import { webSocketPlugin } from './webSocketPlugin';

/**
 * Every subsystem a full dev server runs, in start order.
 *
 * Start order matters and stop order does not depend on it: a plugin is up
 * once its start resolves, so listeners are registered before anything that
 * publishes to them runs, while teardown order comes from each plugin's
 * declared phase. That split is deliberate - reordering this list to fix a
 * startup dependency cannot silently change what gets torn down when.
 *
 * The stores go first because everything else writes to them.
 */
export const DEV_SERVER_PLUGINS: DevServerPlugin[] = [
  kvsPlugin,
  inFlightPlugin,

  eventBusPlugin,
  queuePlugin,
  kvsStreamPlugin,
  serviceFunctionPlugin,

  schedulePlugin,

  apiPlugin,
  webSocketPlugin,
  fileStoragePlugin,
  fileWatcherPlugin,
];

/**
 * What `qpq migrate` runs: the queue actually executes a migration, and the
 * kvs stream keeps projections in step with whatever it writes. No http
 * server, no websockets, no file watching.
 */
export const MIGRATION_DEV_SERVER_PLUGINS: DevServerPlugin[] = [kvsPlugin, inFlightPlugin, queuePlugin, kvsStreamPlugin];
