import { Nullable } from 'quidproquo-core';

import { DevServerShutdownPhase } from '../../logic/shutdown/DevServerShutdownPhase';
import { ResolvedDevServerConfig } from '../../types';
import { DevServerPluginStop } from './DevServerPluginStop';

/**
 * One subsystem of the dev server: the http api, the queue, the websocket
 * servers, the key-value stores.
 *
 * INTERNAL. This is how the dev server composes itself, not an extension point
 * a consumer app plugs into, so it is free to change shape.
 *
 * The contract that matters is that `start` RESOLVES once the subsystem is up.
 * Before this existed, four of these functions ended in `await new Promise(()
 * => {})` purely so the `Promise.all` that ran them never resolved, which left
 * every handle they created stranded inside a function that never returned -
 * and that is why nothing could be shut down.
 */
export type DevServerPlugin = {
  // Used in the boot log and in the shutdown log line when a teardown fails or
  // its phase runs out of budget.
  name: string;

  /**
   * Which shutdown phase this plugin's stop belongs to. Defaults to
   * StopAccepting, which is right for anything holding a port or a watch:
   * stop taking new work first, and let what is already running finish.
   *
   * The two that are not about accepting say so - the in-flight registry
   * drains, the key-value stores persist.
   */
  stopPhase?: DevServerShutdownPhase;

  // Returns null when there is nothing to take down (a plugin that only
  // registers event-bus listeners owns no resource).
  start: (devServerConfig: ResolvedDevServerConfig) => Promise<Nullable<DevServerPluginStop>>;
};
