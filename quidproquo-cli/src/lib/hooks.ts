import fs from 'fs';
import path from 'path';

import { getAppDirectory, getAppsDirectory, getAvailableApps, getRoot } from './discovery';
import { nextPrefixColor, runCommand, runCommandPrefixed } from './runCommand';
import { runDependencyTasks, TaskFailure } from './runTasks';

interface HookPackageJson {
  name?: string;
  scripts?: Record<string, string>;
  workspaces?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

// A directory whose package.json can carry qpq:<hook> scripts: either an app
// (apps/<app>/package.json, which need not be an npm workspace) or any package
// matched by the consumer root's `workspaces` globs.
interface HookPackage {
  dir: string;
  label: string; // app name or package name, for display
  pkg: HookPackageJson;
}

// App lifecycle hooks: apps/<app>/package.json scripts named `qpq:<hook>`
// (e.g. qpq:postinstall, qpq:prebuild). The CLI invokes them when present;
// apps without the hook are skipped silently.
export const runAppHook = async (appName: string, hook: string): Promise<boolean> => {
  const packageJsonPath = path.join(getAppDirectory(appName), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const scriptName = `qpq:${hook}`;
  if (!packageJson.scripts?.[scriptName]) {
    return false;
  }

  console.log(`Running ${scriptName} for [${appName}]`);
  await runCommand('npm', ['run', scriptName], { cwd: getAppDirectory(appName) });
  return true;
};

const isDirectory = (candidate: string): boolean => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory();

const listSubdirectories = (dir: string): string[] => {
  if (!isDirectory(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .map((name) => path.join(dir, name))
    .filter(isDirectory);
};

// Expand one `workspaces` glob. Only literal segments and bare `*` are
// supported, which covers the patterns qpq repos use (e.g.
// "apps/*/services/*/models"); anything fancier ("**", braces) matches nothing.
const expandWorkspacePattern = (root: string, pattern: string): string[] => {
  let dirs = [root];
  for (const segment of pattern.split('/')) {
    if (segment === '*') {
      dirs = dirs.flatMap(listSubdirectories);
    } else {
      dirs = dirs.map((dir) => path.join(dir, segment)).filter(isDirectory);
    }
  }
  return dirs;
};

const readPackageJson = (dir: string): HookPackageJson | undefined => {
  const packageJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return undefined;
  }
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as HookPackageJson;
};

// Every directory that can carry hooks: app dirs plus all workspace packages,
// deduped (an app dir could itself be a workspace).
const getHookPackages = (): HookPackage[] => {
  const root = getRoot();
  const rootPkg = readPackageJson(root);

  const appDirs = getAvailableApps().map((appName) => ({ dir: getAppDirectory(appName), fallbackLabel: appName }));
  const workspaceDirs = (rootPkg?.workspaces ?? [])
    .flatMap((pattern) => expandWorkspacePattern(root, pattern))
    .map((dir) => ({ dir, fallbackLabel: path.relative(root, dir) }));

  const packages: HookPackage[] = [];
  const seen = new Set<string>();
  for (const { dir, fallbackLabel } of [...appDirs, ...workspaceDirs]) {
    const resolved = path.resolve(dir);
    if (seen.has(resolved)) {
      continue;
    }
    seen.add(resolved);

    const pkg = readPackageJson(dir);
    if (pkg) {
      packages.push({ dir, label: pkg.name ?? fallbackLabel, pkg });
    }
  }

  return packages;
};

// The script a hook resolves to in one package: `qpq:<hook>` when defined,
// otherwise the plain `<hook>` script. Empty-string scripts count as absent.
const resolveHookScript = (pkg: HookPackageJson, hook: string): string | undefined => {
  if (pkg.scripts?.[`qpq:${hook}`]) {
    return `qpq:${hook}`;
  }
  if (pkg.scripts?.[hook]) {
    return hook;
  }
  return undefined;
};

const getDeclaredDependencyNames = (pkg: HookPackageJson): string[] =>
  Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies });

// True for a package inside apps/<some other app>/. Packages outside apps/
// are shared, so they never count as another app's.
const isOtherAppPackage = (dir: string, appName: string): boolean => {
  const relative = path.relative(getAppsDirectory(), path.resolve(dir));
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    return false;
  }
  return relative.split(path.sep)[0] !== appName;
};

// The app's own packages and the shared ones, plus every package they depend
// on wherever it lives, so a cross-app dependency still gets built.
const getAppHookPackages = (appName: string): HookPackage[] => {
  const allPackages = getHookPackages();
  const byName = new Map<string, HookPackage>();
  for (const hookPackage of allPackages) {
    if (hookPackage.pkg.name) {
      byName.set(hookPackage.pkg.name, hookPackage);
    }
  }

  const selected = new Set(allPackages.filter((hookPackage) => !isOtherAppPackage(hookPackage.dir, appName)));
  const pending = [...selected];
  for (let current = pending.pop(); current; current = pending.pop()) {
    for (const depName of getDeclaredDependencyNames(current.pkg)) {
      const dep = byName.get(depName);
      if (dep && !selected.has(dep)) {
        selected.add(dep);
        pending.push(dep);
      }
    }
  }

  return allPackages.filter((hookPackage) => selected.has(hookPackage));
};

// Run the hook's script in each of `candidates` that defines it (qpq:<hook>
// preferred over a plain <hook> script), in dependency order (declared deps
// resolved by package name), with up to `jobs` running concurrently. Packages
// whose dependencies aren't part of this run don't wait on them.
const runHookForPackages = async (candidates: HookPackage[], hook: string, jobs: number): Promise<TaskFailure[]> => {
  const hookPackages = candidates
    .map((candidate) => ({ ...candidate, scriptName: resolveHookScript(candidate.pkg, hook) }))
    .filter((candidate): candidate is HookPackage & { scriptName: string } => candidate.scriptName !== undefined);

  if (hookPackages.length === 0) {
    console.log(`No app or workspace package defines a "qpq:${hook}" or "${hook}" script, nothing to run.`);
    return [];
  }

  // Dependency edges only count between packages that are part of this run:
  // a dep that doesn't define the hook has nothing to wait for.
  const runSetNames = new Set(hookPackages.map((hookPackage) => hookPackage.pkg.name).filter(Boolean));

  const tasks = hookPackages.map((hookPackage) => ({
    id: hookPackage.pkg.name ?? hookPackage.dir,
    label: hookPackage.label,
    deps: getDeclaredDependencyNames(hookPackage.pkg).filter((name) => runSetNames.has(name) && name !== hookPackage.pkg.name),
    run: () => runCommandPrefixed(hookPackage.label, 'npm', ['run', hookPackage.scriptName], { cwd: hookPackage.dir, color: nextPrefixColor() }),
  }));

  console.log(`Running ${hook} hooks in ${tasks.length} package(s) (${jobs} jobs, dependency ordered)`);
  return runDependencyTasks(tasks, jobs);
};

/** Runs a hook in every app and workspace package that defines it. Returns the failures; callers decide fatality. */
export const runHookForAllPackages = (hook: string, jobs: number): Promise<TaskFailure[]> => runHookForPackages(getHookPackages(), hook, jobs);

/**
 * Runs a hook in one app's packages, the shared packages outside apps/, and anything those depend on.
 * Other apps' packages are skipped. Returns the failures; callers decide fatality.
 */
export const runHookForAppPackages = (hook: string, appName: string, jobs: number): Promise<TaskFailure[]> =>
  runHookForPackages(getAppHookPackages(appName), hook, jobs);
