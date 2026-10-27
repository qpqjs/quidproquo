export type Task = { label: string; run: () => Promise<void> };
export type TaskFailure = { label: string; error: Error };

// Run tasks with at most `limit` in flight; never rejects — failures come back
// labelled so a whole wave can finish before we report what broke.
export const runTasks = async (tasks: Task[], limit: number): Promise<TaskFailure[]> => {
  const failures: TaskFailure[] = [];
  let nextIndex = 0;

  const workerCount = Math.max(1, Math.min(limit, tasks.length));
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < tasks.length) {
        const task = tasks[nextIndex];
        nextIndex += 1;
        try {
          await task.run();
        } catch (error) {
          failures.push({ label: task.label, error: error as Error });
        }
      }
    }),
  );

  return failures;
};

export type DependencyTask = Task & {
  // Unique id other tasks reference in `deps` (e.g. a package name).
  id: string;
  // Ids of tasks that must succeed before this one starts. Ids not present in
  // the task list should be filtered out by the caller.
  deps: string[];
};

// Run tasks with at most `limit` in flight, but a task only starts once every
// task in its `deps` has succeeded. A failure doesn't stop unrelated tasks;
// dependents of the failed task are skipped (logged, not returned as failures,
// the root cause already is). Never rejects. Tasks left unstartable by a
// dependency cycle come back as failures.
export const runDependencyTasks = async (tasks: DependencyTask[], limit: number): Promise<TaskFailure[]> => {
  const failures: TaskFailure[] = [];
  const succeeded = new Set<string>();
  const failed = new Set<string>();
  const started = new Set<string>();
  const pipelines: Array<Promise<void>> = [];

  let slots = Math.max(1, limit);
  const waiting: Array<() => void> = [];

  const acquire = async (): Promise<void> => {
    if (slots > 0) {
      slots -= 1;
      return;
    }
    await new Promise<void>((resolve) => waiting.push(resolve));
  };

  const release = (): void => {
    const next = waiting.shift();
    if (next) {
      next();
    } else {
      slots += 1;
    }
  };

  const runOne = async (task: DependencyTask): Promise<void> => {
    await acquire();
    try {
      await task.run();
      succeeded.add(task.id);
    } catch (error) {
      failed.add(task.id);
      failures.push({ label: task.label, error: error as Error });
    } finally {
      release();
    }
    launchReady();
  };

  // Repeatedly sweep until stable: launching one task or cascading one skip can
  // unblock (or block) tasks earlier in the list.
  const launchReady = (): void => {
    let changed = true;
    while (changed) {
      changed = false;
      for (const task of tasks) {
        if (started.has(task.id)) continue;
        if (task.deps.some((dep) => failed.has(dep))) {
          started.add(task.id);
          failed.add(task.id); // cascade so transitive dependents skip too
          console.log(`Skipping ${task.label} (a dependency failed)`);
          changed = true;
        } else if (task.deps.every((dep) => succeeded.has(dep))) {
          started.add(task.id);
          pipelines.push(runOne(task));
          changed = true;
        }
      }
    }
  };

  launchReady();
  // runOne re-invokes launchReady as tasks finish, pushing newly unblocked
  // pipelines while earlier ones are being awaited; drain until it stays empty.
  while (pipelines.length > 0) {
    await Promise.all(pipelines.splice(0, pipelines.length));
  }

  for (const task of tasks) {
    if (!started.has(task.id)) {
      failures.push({ label: task.label, error: new Error('unstartable: dependency cycle') });
    }
  }

  return failures;
};

export const assertNoFailures = (phaseName: string, failures: TaskFailure[]): void => {
  if (failures.length === 0) return;
  console.error(`\n${phaseName} failed for:`);
  failures.forEach((failure) => console.error(`  ${failure.label}: ${failure.error.message}`));
  throw new Error(`${phaseName}: ${failures.length} task(s) failed`);
};
