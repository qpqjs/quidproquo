import { awaitDevServerIdle } from '../logic/inFlight/inFlightWork';
import { DevServerShutdownPhase } from '../logic/shutdown/DevServerShutdownPhase';
import { DevServerPlugin } from './types/DevServerPlugin';

/**
 * Work the dev server has accepted and not yet finished: queue messages,
 * kvs-stream projections, storage-drive handlers.
 *
 * It owns no resource, so there is nothing to start. It is a plugin because
 * draining is a shutdown step in its own right, and it is deliberately not
 * owned by the queue: the registry spans three subsystems, and "wait for
 * everything that is running" cannot be any one of their teardowns.
 */
export const inFlightPlugin: DevServerPlugin = {
  name: 'in-flight work',
  stopPhase: DevServerShutdownPhase.Drain,
  start: async () => awaitDevServerIdle,
};
