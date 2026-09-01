import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SIGNALS: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];

// The installed shutdown is module state, so each test needs a fresh copy of
// the module rather than a reset hook.
const loadModule = async () => {
  vi.resetModules();
  return import('./installDevServerShutdownHandlers');
};

// Removing ALL listeners for these signals would take vitest's own with them,
// so only the ones a test added come off again.
let preExistingListeners: Map<NodeJS.Signals, unknown[]>;

beforeEach(() => {
  preExistingListeners = new Map(SIGNALS.map((signal) => [signal, [...process.listeners(signal)]]));

  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
});

afterEach(() => {
  for (const signal of SIGNALS) {
    const before = preExistingListeners.get(signal) ?? [];

    for (const listener of process.listeners(signal)) {
      if (!before.includes(listener)) {
        process.removeListener(signal, listener);
      }
    }
  }

  vi.restoreAllMocks();
});

// The handler is async and the signal emit is not, so give the shutdown a turn
// of the loop to finish before asserting.
const emitAndSettle = async (signal: NodeJS.Signals): Promise<void> => {
  process.emit(signal, signal);
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('installDevServerShutdownHandlers', () => {
  it('runs the installed shutdown and exits 0 on a signal', async () => {
    const { installDevServerShutdownHandlers } = await loadModule();
    const shutdown = vi.fn().mockResolvedValue(undefined);

    installDevServerShutdownHandlers(shutdown);

    await emitAndSettle('SIGTERM');

    expect(shutdown).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('ignores the duplicate signal one ctrl+c produces', async () => {
    // The terminal signals the whole process group and the CLI wrapper then
    // signals its child, so two arrive for one stop. Treating the second as
    // impatience would cut the drain off immediately, every time.
    const { installDevServerShutdownHandlers } = await loadModule();
    const shutdown = vi.fn().mockResolvedValue(undefined);

    installDevServerShutdownHandlers(shutdown);

    process.emit('SIGINT', 'SIGINT');
    await emitAndSettle('SIGTERM');

    expect(shutdown).toHaveBeenCalledTimes(1);
    expect(process.exit).not.toHaveBeenCalledWith(1);
  });

  it('forces exit on a later second signal without re-running the shutdown', async () => {
    vi.useFakeTimers();

    const { installDevServerShutdownHandlers } = await loadModule();
    const shutdown = vi.fn(() => new Promise<void>(() => undefined));

    installDevServerShutdownHandlers(shutdown);

    process.emit('SIGINT', 'SIGINT');
    await vi.advanceTimersByTimeAsync(600);

    process.emit('SIGINT', 'SIGINT');
    await vi.advanceTimersByTimeAsync(0);

    expect(shutdown).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(1);

    vi.useRealTimers();
  });

  it('does not add a second set of signal listeners when called again', async () => {
    // startTinker inside a dev server would otherwise tear everything down twice.
    const { installDevServerShutdownHandlers } = await loadModule();

    installDevServerShutdownHandlers(vi.fn().mockResolvedValue(undefined));
    const afterFirst = process.listeners('SIGTERM').length;

    const second = vi.fn().mockResolvedValue(undefined);
    installDevServerShutdownHandlers(second);

    expect(process.listeners('SIGTERM')).toHaveLength(afterFirst);

    await emitAndSettle('SIGTERM');

    // A later install replaces what runs, so starting more plugins and
    // re-installing tears down the newer set.
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('requestDevServerShutdown', () => {
  it('runs the installed shutdown without exiting the process', async () => {
    // Tinker's REPL exit path: same teardown, its own exit code.
    const { installDevServerShutdownHandlers, requestDevServerShutdown } = await loadModule();
    const shutdown = vi.fn().mockResolvedValue(undefined);

    installDevServerShutdownHandlers(shutdown);

    await requestDevServerShutdown();

    expect(shutdown).toHaveBeenCalledTimes(1);
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('runs once, however many times it is asked', async () => {
    const { installDevServerShutdownHandlers, requestDevServerShutdown } = await loadModule();
    const shutdown = vi.fn().mockResolvedValue(undefined);

    installDevServerShutdownHandlers(shutdown);

    await requestDevServerShutdown();
    await requestDevServerShutdown();

    expect(shutdown).toHaveBeenCalledTimes(1);
  });

  it('resolves when nothing is installed', async () => {
    const { requestDevServerShutdown } = await loadModule();

    await expect(requestDevServerShutdown()).resolves.toBeUndefined();
  });
});
