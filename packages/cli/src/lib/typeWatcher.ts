// Keeps workspace packages' declaration output (dist/*.d.ts) fresh while
// `qpq go:dev` runs. The rspack dev builds bundle workspace source directly,
// so this watcher only feeds the editor and validate-ts, which resolve
// cross-package types through each package's built declarations.
//
// One `tsc -b --watch` over every workspace package that ships types; routine
// watch chatter is dropped so only real compile errors reach the shared
// terminal. Opt out with `--no-types`.
import { getWorkspacePackageDirs } from 'quidproquo-deploy-rspack';

import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Routine tsc watch status lines; everything else is worth showing.
const routineTscPatterns = [/Starting compilation in watch mode/, /File change detected/, /Found 0 errors/];

const isRoutineTscLine = (line: string): boolean => routineTscPatterns.some((pattern) => pattern.test(line));

// Forwards non-routine tsc output line by line under a [types] prefix.
const forwardTscOutput = (chunk: Buffer): void => {
  for (const line of chunk.toString().split('\n')) {
    if (line.trim().length === 0 || isRoutineTscLine(line)) {
      continue;
    }
    console.log(`[types] ${line}`);
  }
};

// A workspace package wants declaration watching when it has a tsconfig and
// publishes types from its build output. Packages bundled by rspack (views,
// service handlers) don't ship types and are skipped.
const isTypedWorkspacePackage = (dir: string): boolean => {
  if (!fs.existsSync(path.join(dir, 'tsconfig.json'))) {
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
  return !!(packageJson.types || packageJson.typings);
};

export const startTypeWatcher = (root: string): ChildProcess | null => {
  const projectDirs = getWorkspacePackageDirs(root).filter(isTypedWorkspacePackage);
  if (projectDirs.length === 0) {
    return null;
  }

  const relativeDirs = projectDirs.map((dir) => path.relative(root, dir));
  const child = spawn('npx', ['tsc', '-b', ...relativeDirs, '--watch', '--preserveWatchOutput', '--pretty'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });

  child.stdout?.on('data', forwardTscOutput);
  child.stderr?.on('data', forwardTscOutput);

  console.log(`Type watcher: tsc -b --watch over ${relativeDirs.length} workspace packages (disable with --no-types).`);

  return child;
};
