import { DevServerShutdownPhase } from './DevServerShutdownPhase';
import { DevServerShutdownTask } from './DevServerShutdownTask';

/**
 * How long each phase gets before it is abandoned and the next one starts.
 *
 * Budgeted PER PHASE, deliberately, not once overall. A single overall timeout
 * has a nasty failure mode: one wedged story eats the whole window during
 * Drain and the process exits without ever running Persist, which loses more
 * than doing nothing would. Per-phase budgets guarantee Persist runs.
 *
 * 5s worst case total. A normal restart costs tens of milliseconds - these
 * numbers only bite when something is genuinely stuck, and a stuck dev server
 * blocking the inner loop for longer than this is worse than the work it is
 * still holding.
 */
const PHASE_BUDGET_MS: Record<DevServerShutdownPhase, number> = {
  [DevServerShutdownPhase.StopAccepting]: 1000,
  [DevServerShutdownPhase.Drain]: 2000,
  [DevServerShutdownPhase.Persist]: 2000,
};

const SHUTDOWN_PHASES_IN_ORDER = [DevServerShutdownPhase.StopAccepting, DevServerShutdownPhase.Drain, DevServerShutdownPhase.Persist];

const PHASE_NAMES: Record<DevServerShutdownPhase, string> = {
  [DevServerShutdownPhase.StopAccepting]: 'stop-accepting',
  [DevServerShutdownPhase.Drain]: 'drain',
  [DevServerShutdownPhase.Persist]: 'persist',
};

// A failing teardown must not take its siblings, or the later phases, down
// with it: the whole point of the sequence is that Persist runs. Log which one
// broke and carry on.
const runShutdownTask = async (task: DevServerShutdownTask): Promise<void> => {
  try {
    await task.run();
  } catch (error) {
    console.error(`[shutdown] task [${task.name}] failed:`, error);
  }
};

// Resolves true if the work finished inside the budget, false if the budget
// expired first. The work is NOT cancelled on expiry - nothing here is
// cancellable - it is simply no longer waited on.
const settleWithinBudget = (work: Promise<unknown>, budgetMs: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), budgetMs);

    void work.then(() => {
      clearTimeout(timer);
      resolve(true);
    });
  });
};

/**
 * Run a set of teardowns, phase by phase, and resolve once the last one has
 * finished or run out of budget.
 *
 * The tasks are passed in rather than read from a registry: they come from
 * whatever the caller actually started, so `qpq migrate` tears down the two
 * plugins it ran and a full dev server tears down all of them, with no shared
 * state deciding which is which.
 *
 * Does not exit the process. The caller decides that, because tinker's REPL
 * and a signal handler want different exit codes.
 */
export const runDevServerShutdown = async (shutdownTasks: DevServerShutdownTask[]): Promise<void> => {
  for (const phase of SHUTDOWN_PHASES_IN_ORDER) {
    const tasks = shutdownTasks.filter((task) => task.phase === phase);

    if (tasks.length === 0) {
      continue;
    }

    const startedAt = Date.now();
    const finished = await settleWithinBudget(Promise.all(tasks.map(runShutdownTask)), PHASE_BUDGET_MS[phase]);
    const elapsedMs = Date.now() - startedAt;

    if (finished) {
      console.log(`[shutdown] ${PHASE_NAMES[phase]} done in ${elapsedMs}ms`);
    } else {
      console.warn(`[shutdown] ${PHASE_NAMES[phase]} budget expired after ${elapsedMs}ms, moving on (${tasks.map((task) => task.name).join(', ')})`);
    }
  }
};
