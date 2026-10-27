// SIGHUP is in the list because closing the terminal a dev server was started
// from sends it, and that is a perfectly ordinary way to stop one.
//
// SIGKILL is not, and cannot be: it is unhandleable by design. `kill -9`, an
// OOM kill and a laptop losing power all drop whatever was in flight, and
// nothing in this file can change that. Do not add a case for it.
const SHUTDOWN_SIGNALS: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];

// A second signal means "I am impatient, stop now". But two signals also
// arrive for one ctrl+c: the terminal delivers SIGINT to the whole foreground
// process group (so this process gets it directly) and the qpq CLI wrapper
// then sends its own SIGTERM to the child it spawned. Treating that pair as
// impatience would cut the drain off milliseconds after starting it, every
// time. Anything inside this window is the same stop; anything after it is a
// person asking again.
const DUPLICATE_SIGNAL_WINDOW_MS = 500;

// A process has exactly one shutdown, so this is the one piece of module state
// worth keeping: install stores what to run, and requestDevServerShutdown lets
// a non-signal exit path (tinker's REPL) run the same thing without having to
// be handed the task list.
const state: {
  shutdown: (() => Promise<void>) | null;
  shuttingDown: boolean;
  startedAt: number;
} = {
  shutdown: null,
  shuttingDown: false,
  startedAt: 0,
};

/**
 * Run the installed shutdown once, whatever asked for it.
 *
 * Resolves immediately if nothing is installed (a bare `createTinkerInterface`
 * with no plugins started has nothing to tear down) or if a shutdown is
 * already under way.
 */
export const requestDevServerShutdown = async (): Promise<void> => {
  if (state.shuttingDown || !state.shutdown) {
    return;
  }

  state.shuttingDown = true;
  state.startedAt = Date.now();

  await state.shutdown();
};

// The explicit process.exit is required, not tidiness: startDevServer parks on
// a promise that never resolves, so the event loop has no reason to drain once
// the teardowns are done and the process would otherwise just sit there.
const handleShutdownSignal = async (signal: NodeJS.Signals): Promise<void> => {
  if (state.shuttingDown) {
    if (Date.now() - state.startedAt < DUPLICATE_SIGNAL_WINDOW_MS) {
      return;
    }

    // A second ctrl+c has to still work, or a stuck teardown means reaching
    // for kill -9 and losing everything the sequence was trying to save.
    console.warn(`[shutdown] ${signal} received while already shutting down, forcing exit`);
    return process.exit(1);
  }

  console.log(`[shutdown] ${signal} received, shutting down`);

  await requestDevServerShutdown();

  process.exit(0);
};

/**
 * Wire a shutdown to the signals that stop a dev server.
 *
 * Takes the shutdown rather than reading a registry, so what gets torn down is
 * whatever the caller actually started. Idempotent on the signal handlers:
 * a tinker session started inside a dev server would otherwise register twice
 * and run every teardown twice. A later call still replaces the shutdown it
 * runs, which is what makes "start more plugins, then re-install" work.
 */
export const installDevServerShutdownHandlers = (shutdown: () => Promise<void>): void => {
  const alreadyInstalled = state.shutdown !== null;

  state.shutdown = shutdown;

  if (alreadyInstalled) {
    return;
  }

  for (const signal of SHUTDOWN_SIGNALS) {
    process.on(signal, handleShutdownSignal);
  }
};
