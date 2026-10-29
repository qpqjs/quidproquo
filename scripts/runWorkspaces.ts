import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { ActiveStep, clearDown, cursorToBlockStart, formatElapsed, ProgressState, renderBlock } from './progressBar';

type PackageJson = {
  name: string;
  version?: string;
  workspaces?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

// One workspace's work for this run. `anytime` scripts start as soon as the run does,
// regardless of dependencies, and only take a job slot no staged step is waiting for.
// Stages run in order, the scripts inside a stage run concurrently, and the first stage
// doesn't start until every `anytime` script has finished and every workspace listed in
// `deps` has finished all of its stages.
type PkgTask = {
  dir: string; // workspace directory, passed to `npm -w`
  name: string; // package name, for display
  version: string;
  anytime: string[];
  stages: string[][];
  deps: string[]; // workspace dirs (within this run) that must build first
};

type StepPlan = Pick<PkgTask, 'anytime' | 'stages'>;

const repoRoot = path.join(__dirname, '..');

const readPackageJson = (dir: string): PackageJson =>
  JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as PackageJson;

// The `workspaces` array is only the launch-order tiebreak between tasks that become
// ready at the same time. Real ordering constraints come from the dependency graph
// wired up in buildTasks; the array itself is not reliably topological (deploy-rspack
// sits before @qpqjs/deploy-aws, which it declares as a dep).
const getOrderedWorkspaces = (): string[] => readPackageJson(repoRoot).workspaces || [];

// Scripts whose aggregate form is driven as sub-scripts. `anytime` scripts have no
// ordering constraints: clean only deletes the package's own outputs, which nothing
// reads until its own compile, so it can soak up idle slots while unrelated packages
// build. `stages` run in order, scripts inside one stage concurrently. esm and cjs
// compile the same src into separate outDirs (no shared tsbuildinfo), so they overlap
// safely; build:extension (only @qpqjs/actionprocessor-aws) esbuild-bundles
// the log-extension layer straight from src into lib/extension-layer, independent of
// tsc; build:bin-perms (@qpqjs/cli, create-qpq-app) chmods a bin file tsc just
// emitted, so it must wait for the compiles. Packages missing a sub-script skip it.
const STEP_PLANS: Record<string, StepPlan> = {
  build: { anytime: ['clean'], stages: [['build:esm', 'build:cjs', 'build:extension'], ['build:bin-perms']] },
};

// Only `build` reads other workspaces' lib/ outputs (and its clean deletes them), so
// only `build` needs dependency ordering. Everything else (lint, lint:fix) works on
// src in isolation and can run fully parallel.
const DEPENDENCY_ORDERED_SCRIPTS = new Set(['build']);

// Note: empty-string scripts (e.g. @qpqjs/tsconfig's `"build": ""`) are falsy,
// so they're excluded here and such workspaces contribute zero steps.
// useStages=false (--no-stages) skips the sub-script expansion and runs the package's
// own aggregate script as a single step, for comparing against staged execution.
const getStepPlan = (pkg: PackageJson, script: string, useStages: boolean): StepPlan => {
  const hasScript = (sub: string): boolean => Boolean(pkg.scripts?.[sub]);
  const plan = useStages ? STEP_PLANS[script] : undefined;
  if (plan) {
    const stages = plan.stages.map((stage) => stage.filter(hasScript)).filter((stage) => stage.length > 0);
    // A package with only the anytime scripts (no compile) falls through to its aggregate
    // script, which is expected to do its own clean.
    if (stages.length > 0) {
      return { anytime: plan.anytime.filter(hasScript), stages };
    }
  }
  return { anytime: [], stages: hasScript(script) ? [[script]] : [] };
};

// Every path git reports maps to at most one top-level workspace dir.
const getChangedDirs = (): Set<string> => {
  const changed = execSync('git status --porcelain', { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .map((line) => line.slice(3).trim()) // strip the 2-char status + space
    .filter(Boolean)
    // A rename shows as "old -> new"; the new path is what matters.
    .map((file) => (file.includes(' -> ') ? file.split(' -> ')[1] : file))
    .map((file) => file.split('/')[0]);

  return new Set(changed);
};

const buildTasks = (script: string, mode: 'all' | 'changed', useStages: boolean): PkgTask[] => {
  const workspaces = getOrderedWorkspaces();
  const changedDirs = mode === 'changed' ? getChangedDirs() : null;

  // Read every workspace's package.json (not just the changed ones): the name -> dir
  // map is needed to resolve declared dependencies into workspace dirs.
  const pkgs = new Map<string, PackageJson>();
  const dirByName = new Map<string, string>();
  for (const dir of workspaces) {
    const pkg = readPackageJson(path.join(repoRoot, dir));
    pkgs.set(dir, pkg);
    dirByName.set(pkg.name, dir);
  }

  const tasks: PkgTask[] = [];
  for (const dir of workspaces) {
    if (changedDirs && !changedDirs.has(dir)) {
      continue;
    }
    const pkg = pkgs.get(dir)!;
    const plan = getStepPlan(pkg, script, useStages);
    if (plan.stages.length > 0) {
      tasks.push({ dir, name: pkg.name, version: pkg.version ?? '', ...plan, deps: [] });
    }
  }

  // Wire dependency edges, but only between workspaces that are part of this run:
  // an unchanged dependency keeps its already-built lib/, so nothing to wait for.
  if (DEPENDENCY_ORDERED_SCRIPTS.has(script)) {
    const taskDirs = new Set(tasks.map((task) => task.dir));
    for (const task of tasks) {
      const pkg = pkgs.get(task.dir)!;
      // devDependencies only serve tests, which no build compiles, so they are not build inputs;
      // wiring them would also deadlock core (dev-depends on testing) against testing (depends on core).
      const declared = { ...pkg.dependencies, ...pkg.peerDependencies };
      task.deps = Object.keys(declared)
        .map((name) => dirByName.get(name))
        .filter((depDir): depDir is string => depDir !== undefined && taskDirs.has(depDir));
    }
  }

  return tasks;
};

// Run one workspace script to completion, capturing all output. Nothing is streamed
// live: on success the output is discarded (tsc is quiet), on failure the caller
// prints it. stdin is inherited-as-pipe so a stray prompt can't silently hang us.
const runStep = (dir: string, script: string): Promise<{ code: number; output: string }> =>
  new Promise((resolve) => {
    const child = spawn('npm', ['run', script, '-w', dir], {
      cwd: repoRoot,
      shell: process.platform === 'win32',
    });

    let output = '';
    const collect = (buf: Buffer) => {
      output += buf.toString();
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);

    child.on('close', (code) => resolve({ code: code ?? 0, output }));
    child.on('error', (err) => resolve({ code: 1, output: String(err) }));
  });

type Priority = 'high' | 'low';

// Minimal counting semaphore, capping how many npm child processes run at once
// across all workspaces and stages. A freed slot always goes to a waiting high
// priority step before any low priority one, so anytime scripts can never hold up a
// compile that is ready to go.
class Semaphore {
  private waiting: Record<Priority, Array<() => void>> = { high: [], low: [] };

  constructor(private slots: number) {}

  async acquire(priority: Priority): Promise<void> {
    if (this.slots > 0) {
      this.slots -= 1;
      return;
    }
    await new Promise<void>((resolve) => this.waiting[priority].push(resolve));
  }

  release(): void {
    const next = this.waiting.high.shift() ?? this.waiting.low.shift();
    if (next) {
      next();
    } else {
      this.slots += 1;
    }
  }
}

// Default: leave a core for the rest of the machine, and cap at 8 so a wide
// dependency level doesn't stack up a dozen memory-hungry tsc processes at once.
const getJobs = (args: string[]): number => {
  const flag = args.find((arg) => arg.startsWith('--jobs='));
  if (flag) {
    const parsed = Number(flag.split('=')[1]);
    if (Number.isFinite(parsed) && parsed >= 1) {
      return Math.floor(parsed);
    }
  }
  return Math.max(1, Math.min(8, os.availableParallelism() - 1));
};

const countSteps = (tasks: PkgTask[]): number =>
  tasks.reduce((sum, task) => sum + task.anytime.length + task.stages.reduce((stageSum, stage) => stageSum + stage.length, 0), 0);

const main = async (): Promise<void> => {
  const [script, ...args] = process.argv.slice(2);
  if (!script) {
    console.error('runWorkspaces - usage: tsx ./scripts/runWorkspaces.ts <script-name> [--all|--changed] [--jobs=N] [--no-stages]');
    process.exit(1);
  }

  const mode: 'all' | 'changed' = args.includes('--changed') ? 'changed' : 'all';
  const jobs = getJobs(args);
  const useStages = !args.includes('--no-stages');
  const tasks = buildTasks(script, mode, useStages);

  if (tasks.length === 0) {
    const scope = mode === 'changed' ? 'changed workspace(s)' : 'workspace(s)';
    console.log(`${script} (${mode}) - no ${scope} with a "${script}" script, nothing to run.`);
    return;
  }

  const isTty = Boolean(process.stdout.isTTY);
  const state: ProgressState = { total: countSteps(tasks), done: 0, active: [], startMs: Date.now() };
  let frame = 0;
  let drawnLines = 0;

  const draw = () => {
    if (!isTty) {
      return;
    }
    // Some ptys (e.g. `script`) report 0 columns; fall back to a sane width.
    const lines = renderBlock(state, frame, Date.now(), process.stdout.columns || 120);
    process.stdout.write(cursorToBlockStart(drawnLines) + clearDown() + lines.join('\n') + '\n');
    drawnLines = lines.length;
  };

  // The spinner animates on its own timer since the scheduler blocks (via await) on
  // the child processes.
  const timer = isTty
    ? setInterval(() => {
        frame += 1;
        draw();
      }, 80)
    : undefined;

  const finish = () => {
    if (timer) {
      clearInterval(timer);
    }
    if (isTty) {
      process.stdout.write(cursorToBlockStart(drawnLines) + clearDown());
      drawnLines = 0;
    }
  };

  const semaphore = new Semaphore(jobs);
  const failures: Array<{ name: string; script: string; code: number; output: string }> = [];
  let aborted = false;

  // dir -> deps that haven't finished yet; a task launches once its set is empty.
  const remainingDeps = new Map(tasks.map((task) => [task.dir, new Set(task.deps)]));
  const started = new Set<string>();
  const pipelines: Array<Promise<void>> = [];

  // Runs one script in one workspace under the global job cap, tracked as an active
  // lane in the progress display. A failure flips `aborted`: nothing new starts,
  // steps already in flight drain to completion so their output can't interleave.
  const runTrackedStep = async (task: PkgTask, scriptName: string, priority: Priority): Promise<boolean> => {
    if (aborted) {
      return false;
    }
    await semaphore.acquire(priority);
    if (aborted) {
      semaphore.release();
      return false;
    }

    const lane: ActiveStep = { label: `${task.name}@${task.version} › ${scriptName}`, startMs: Date.now() };
    state.active.push(lane);
    if (!isTty) {
      console.log(`▶ ${task.name} › ${scriptName}`);
    }
    draw();

    const { code, output } = await runStep(task.dir, scriptName);

    state.active.splice(state.active.indexOf(lane), 1);
    semaphore.release();

    if (code !== 0) {
      aborted = true;
      failures.push({ name: task.name, script: scriptName, code, output });
      return false;
    }

    state.done += 1;
    if (!isTty) {
      console.log(`✔ [${state.done}/${state.total}] ${task.name} › ${scriptName} (${formatElapsed(Date.now() - lane.startMs)})`);
    }
    draw();
    return true;
  };

  // Every workspace's anytime scripts are kicked off up front at low priority. Tasks
  // with no dependencies go first so the packages that can compile soonest are the
  // first ones ready to.
  const anytimeOrder = [...tasks].sort((a, b) => Number(a.deps.length > 0) - Number(b.deps.length > 0));
  const anytimeDone = new Map<string, Promise<boolean>>();
  for (const task of anytimeOrder) {
    const results = Promise.all(task.anytime.map((scriptName) => runTrackedStep(task, scriptName, 'low')));
    anytimeDone.set(
      task.dir,
      results.then((flags) => !flags.includes(false)),
    );
  }

  // Waits for the workspace's anytime scripts, then runs its stages in order (scripts
  // within a stage concurrently), then unblocks whatever was waiting on this
  // workspace. On failure the task stops between stages and never unblocks its
  // dependents.
  const runTask = async (task: PkgTask): Promise<void> => {
    if (!(await anytimeDone.get(task.dir))) {
      return;
    }
    for (const stage of task.stages) {
      const results = await Promise.all(stage.map((scriptName) => runTrackedStep(task, scriptName, 'high')));
      if (results.includes(false)) {
        return;
      }
    }
    for (const deps of remainingDeps.values()) {
      deps.delete(task.dir);
    }
    launchReady();
  };

  const launchReady = () => {
    for (const task of tasks) {
      if (aborted) {
        return;
      }
      if (started.has(task.dir) || remainingDeps.get(task.dir)!.size > 0) {
        continue;
      }
      started.add(task.dir);
      pipelines.push(runTask(task));
    }
  };

  launchReady();
  // runTask pushes newly unblocked pipelines while earlier ones are being awaited,
  // so keep draining until the array stays empty.
  while (pipelines.length > 0) {
    const batch = pipelines.splice(0, pipelines.length);
    await Promise.all(batch);
  }

  finish();

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`\n✖ ${failure.name} › ${failure.script} failed (exit ${failure.code}):\n`);
      console.error(failure.output.trimEnd());
    }
    process.exit(failures[0].code || 1);
  }

  if (started.size < tasks.length) {
    const stuck = tasks.filter((task) => !started.has(task.dir)).map((task) => task.name);
    console.error(`✖ dependency cycle between workspaces, could not schedule: ${stuck.join(', ')}`);
    process.exit(1);
  }

  console.log(
    `✔ ${script}: ${state.total} step(s) across ${tasks.length} workspace(s) in ${formatElapsed(
      Date.now() - state.startMs,
    )} (${jobs} jobs)`,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
