/**
 * How to take a started subsystem back down.
 *
 * Returned BY start rather than declared alongside it, so it closes over the
 * handle start created (an http.Server, a chokidar watcher) instead of that
 * handle having to be stashed somewhere both halves can reach.
 */
export type DevServerPluginStop = () => Promise<void>;
