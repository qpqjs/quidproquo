import { describe, expect, it, vi } from 'vitest';

import { DevServerShutdownPhase } from '../logic/shutdown/DevServerShutdownPhase';
import { ResolvedDevServerConfig } from '../types';
import { DevServerPlugin } from './types/DevServerPlugin';
import { startDevServerPlugins } from './startDevServerPlugins';

const devServerConfig = { runtimePath: '.qpq-runtime' } as ResolvedDevServerConfig;

describe('startDevServerPlugins', () => {
  it('starts plugins in order, waiting for each', async () => {
    // The property the 100ms sleeps used to stand in for: a plugin that
    // publishes cannot run before a plugin that listens has registered.
    const order: string[] = [];

    const settleOnNextTurn = (label: string): DevServerPlugin => ({
      name: label,
      start: async () => {
        order.push(`${label}:start`);
        await new Promise((resolve) => setTimeout(resolve, 0));
        order.push(`${label}:up`);
        return null;
      },
    });

    await startDevServerPlugins([settleOnNextTurn('a'), settleOnNextTurn('b')], devServerConfig);

    expect(order).toEqual(['a:start', 'a:up', 'b:start', 'b:up']);
  });

  it('collects a task per plugin that hands back a stop', async () => {
    const stopApi = vi.fn().mockResolvedValue(undefined);
    const stopStores = vi.fn().mockResolvedValue(undefined);

    const tasks = await startDevServerPlugins(
      [
        { name: 'api', start: async () => stopApi },
        { name: 'queue', start: async () => null },
        { name: 'stores', stopPhase: DevServerShutdownPhase.Persist, start: async () => stopStores },
      ],
      devServerConfig,
    );

    expect(tasks).toEqual([
      { name: 'api', phase: DevServerShutdownPhase.StopAccepting, run: stopApi },
      { name: 'stores', phase: DevServerShutdownPhase.Persist, run: stopStores },
    ]);
  });

  it('defaults a plugin with no declared phase to StopAccepting', async () => {
    const [task] = await startDevServerPlugins([{ name: 'api', start: async () => vi.fn().mockResolvedValue(undefined) }], devServerConfig);

    expect(task.phase).toBe(DevServerShutdownPhase.StopAccepting);
  });

  it('passes the resolved config to each plugin', async () => {
    const start = vi.fn().mockResolvedValue(null);

    await startDevServerPlugins([{ name: 'kvs', start }], devServerConfig);

    expect(start).toHaveBeenCalledWith(devServerConfig);
  });
});
