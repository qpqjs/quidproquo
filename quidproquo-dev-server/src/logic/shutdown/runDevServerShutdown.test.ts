import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DevServerShutdownPhase } from './DevServerShutdownPhase';
import { DevServerShutdownTask } from './DevServerShutdownTask';
import { runDevServerShutdown } from './runDevServerShutdown';

// The tasks are a plain argument now, so each test builds its own list and
// there is no shared registry to reset.
let shutdownTasks: DevServerShutdownTask[];

const registerDevServerShutdownTask = (task: DevServerShutdownTask): void => {
  shutdownTasks.push(task);
};

beforeEach(() => {
  shutdownTasks = [];
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('runDevServerShutdown', () => {
  it('runs the phases in order, never starting a later one before an earlier one settles', async () => {
    const order: string[] = [];

    const settleOnNextTurn = async (label: string): Promise<void> => {
      order.push(`${label}:start`);
      await new Promise((resolve) => setTimeout(resolve, 0));
      order.push(`${label}:end`);
    };

    // Registered out of phase order on purpose: the phase decides, not the
    // order things happened to register in.
    registerDevServerShutdownTask({ name: 'persist', phase: DevServerShutdownPhase.Persist, run: () => settleOnNextTurn('persist') });
    registerDevServerShutdownTask({ name: 'stop', phase: DevServerShutdownPhase.StopAccepting, run: () => settleOnNextTurn('stop') });
    registerDevServerShutdownTask({ name: 'drain', phase: DevServerShutdownPhase.Drain, run: () => settleOnNextTurn('drain') });

    await runDevServerShutdown(shutdownTasks);

    expect(order).toEqual(['stop:start', 'stop:end', 'drain:start', 'drain:end', 'persist:start', 'persist:end']);
  });

  it('runs the tasks within one phase concurrently', async () => {
    const order: string[] = [];

    const settleOnNextTurn = async (label: string): Promise<void> => {
      order.push(`${label}:start`);
      await new Promise((resolve) => setTimeout(resolve, 0));
      order.push(`${label}:end`);
    };

    registerDevServerShutdownTask({ name: 'a', phase: DevServerShutdownPhase.StopAccepting, run: () => settleOnNextTurn('a') });
    registerDevServerShutdownTask({ name: 'b', phase: DevServerShutdownPhase.StopAccepting, run: () => settleOnNextTurn('b') });

    await runDevServerShutdown(shutdownTasks);

    expect(order).toEqual(['a:start', 'b:start', 'a:end', 'b:end']);
  });

  it('logs a task that throws without stopping its siblings or the later phases', async () => {
    const ran: string[] = [];

    registerDevServerShutdownTask({
      name: 'broken',
      phase: DevServerShutdownPhase.StopAccepting,
      run: () => Promise.reject(new Error('teardown blew up')),
    });
    registerDevServerShutdownTask({
      name: 'sibling',
      phase: DevServerShutdownPhase.StopAccepting,
      run: async () => {
        ran.push('sibling');
      },
    });
    registerDevServerShutdownTask({
      name: 'persist',
      phase: DevServerShutdownPhase.Persist,
      run: async () => {
        ran.push('persist');
      },
    });

    await runDevServerShutdown(shutdownTasks);

    expect(ran).toEqual(['sibling', 'persist']);
    expect(console.error).toHaveBeenCalledWith('[shutdown] task [broken] failed:', expect.any(Error));
  });

  it('abandons a phase that blows its budget and still runs persist', async () => {
    // The whole reason the budgets are per phase: a wedged drain must not cost
    // us the stores.
    vi.useFakeTimers();

    const ran: string[] = [];

    registerDevServerShutdownTask({
      name: 'wedged',
      phase: DevServerShutdownPhase.Drain,
      run: () => new Promise<void>(() => undefined),
    });
    registerDevServerShutdownTask({
      name: 'persist',
      phase: DevServerShutdownPhase.Persist,
      run: async () => {
        ran.push('persist');
      },
    });

    const shutdown = runDevServerShutdown(shutdownTasks);

    await vi.advanceTimersByTimeAsync(2000);
    await shutdown;

    expect(ran).toEqual(['persist']);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('drain budget expired'));
  });

  it('does nothing when no task is registered', async () => {
    await expect(runDevServerShutdown(shutdownTasks)).resolves.toBeUndefined();
    expect(console.log).not.toHaveBeenCalled();
  });
});
