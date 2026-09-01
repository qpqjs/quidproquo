import { DevServerShutdownPhase } from '../logic/shutdown/DevServerShutdownPhase';
import { DevServerShutdownTask } from '../logic/shutdown/DevServerShutdownTask';
import { ResolvedDevServerConfig } from '../types';
import { DevServerPlugin } from './types/DevServerPlugin';

/**
 * Start each plugin in turn and collect the teardowns they hand back.
 *
 * Sequential, not `Promise.all`: a plugin is up once its start resolves, so
 * starting in order means a plugin that publishes onto the event bus cannot
 * run before a plugin that listens on it has registered. That used to be
 * covered by a 100ms sleep in the two callers that fired these off without
 * awaiting them; both sleeps are gone.
 *
 * The returned tasks are what the caller hands to runDevServerShutdown, so
 * only what was actually started is ever torn down.
 */
export const startDevServerPlugins = async (
  plugins: DevServerPlugin[],
  devServerConfig: ResolvedDevServerConfig,
): Promise<DevServerShutdownTask[]> => {
  const shutdownTasks: DevServerShutdownTask[] = [];

  for (const plugin of plugins) {
    const stop = await plugin.start(devServerConfig);

    if (!stop) {
      continue;
    }

    shutdownTasks.push({
      name: plugin.name,
      phase: plugin.stopPhase ?? DevServerShutdownPhase.StopAccepting,
      run: stop,
    });
  }

  return shutdownTasks;
};
