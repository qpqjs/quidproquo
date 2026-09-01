// Pre-start sweep shared by the dev-server commands: a previous run whose
// wrapper died without killing its listener (closed terminal, SIGKILL) leaves
// an orphaned process holding a dev port, and the next launch dies with
// EADDRINUSE. Before starting, kill any listener on the given ports whose
// command line matches `isOurs`. Anything else on the ports is left alone
// and reported — it's not ours.
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Matches any invocation of the qpq CLI itself, regardless of how it was
// launched: `node node_modules/.bin/qpq ...` (the npm-script shim, which has
// no .js extension), a direct `node .../lib/commonjs/bin/qpq.js` call, a
// global `qpq` shebang script, etc. Checks each whitespace-separated token's
// basename (extension stripped) rather than a fixed substring like
// 'bin/qpq.js', which only matches the last of those forms.
export const isQpqCliCommand = (command: string): boolean =>
  command
    .trim()
    .split(/\s+/)
    .some((token) => {
      const base = path.basename(token);
      const withoutExt = base.endsWith('.js') ? base.slice(0, -3) : base;
      return withoutExt === 'qpq';
    });

// SIGTERM only requests termination — the caller (about to bind this same
// process's ports itself) needs it actually gone first. A stale dev server
// can be mid-startup when killed (still resolving config, not yet bound to
// every port it eventually binds) and keep running for a bit past the
// signal, going on to bind a LATER port — waiting for just the one port that
// matched isn't enough; wait for the whole pid to disappear so it can't bind
// anything else afterward. Poll synchronously (this whole sweep runs before
// anything async starts) via `kill(pid, 0)` — reliable and fast here because
// these are unrelated, previously-orphaned processes, not children of this
// one (a real child can sit as a zombie answering `kill(pid, 0)` until this
// process's own event loop reaps it, which a tight sync loop would starve;
// doesn't apply to a process we didn't spawn).
//
// The default covers the dev server's graceful shutdown (drain in-flight work,
// then checkpoint the stores) with room to spare — it used to be 3s, which was
// fine when the server died instantly and is not now. Returns whether the pid
// actually went, because a caller about to bind these ports has to escalate
// rather than hope: giving up while the old server still holds 8080 is exactly
// the EADDRINUSE this file exists to prevent.
const waitForPidGone = (pid: number, timeoutMs = 8000): boolean => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      process.kill(pid, 0);
    } catch {
      return true; // throws once the pid no longer exists
    }
    execSync('sleep 0.05');
  }

  return false;
};

// Last resort for a process that ignored, or wedged during, its graceful stop.
const killPidHard = (pid: number): void => {
  console.warn(`Process ${pid} did not exit gracefully — sending SIGKILL.`);
  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    return; // raced us and exited after all
  }
  waitForPidGone(pid, 2000);
};

// realpath'd: lsof reports the canonical path (e.g. /private/tmp on macOS,
// where /tmp is a symlink), so comparing against a caller-supplied root
// verbatim would false-negative whenever any component of the repo path is
// itself a symlink (a symlinked home directory, an NFS mount, etc).
const getProcessCwd = (pid: number): string | null => {
  try {
    const line = execSync(`lsof -a -p ${pid} -d cwd -Fn`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .split('\n')
      .find((l) => l.startsWith('n'));
    return line ? fs.realpathSync(line.slice(1)) : null;
  } catch {
    return null; // pid gone, or we don't have permission to inspect it
  }
};

// The sweep below must never target this process's own wrappers: launched as
// `npx qpq go:dev:api` (or via any shell whose -c string names qpq), the
// ancestor chain (`sh -c "npx ... qpq ..."`, `npm exec qpq ...`) matches
// isQpqCliCommand and shares our cwd, so excluding just process.pid isn't
// enough — SIGINTing an ancestor tears down our own tree. Walk ppid to the
// top and exclude the whole chain.
const getOwnAncestorPids = (): Set<number> => {
  const ancestors = new Set<number>();
  let pid = process.pid;
  while (pid > 1 && !ancestors.has(pid)) {
    ancestors.add(pid);
    try {
      pid = Number(
        execSync(`ps -o ppid= -p ${pid}`, { stdio: ['ignore', 'pipe', 'ignore'] })
          .toString()
          .trim(),
      );
    } catch {
      break;
    }
  }
  return ancestors;
};

// killStaleListeners only sees processes currently BOUND to one of the given
// ports — it can't catch a still-running `qpq go:dev*` watcher whose spawned
// dev-server child already died (a crash, or us killing just the child):
// the watcher itself holds no port at that moment, so it's invisible to a
// port scan, yet it's still alive and can spawn a fresh child — and bind a
// port — moments later, racing whatever we're about to start. Close that gap
// by finding any OTHER qpq CLI process rooted in the same repo checkout
// (matched by cwd, not by port or command-line args, which vary by how it
// was invoked) and killing it outright, regardless of what it currently has
// bound. SIGINT (not SIGTERM) so goDevApiCommand/goDevWebCommand's own
// handler runs and tears down its child cleanly rather than orphaning it.
export const killOtherQpqDevProcesses = (root: string): void => {
  const resolvedRoot = fs.realpathSync(root);
  const ownPids = getOwnAncestorPids();

  let lines: string[] = [];
  try {
    lines = execSync('ps -axo pid=,command=', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .split('\n');
  } catch {
    return;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex === -1) continue;

    const pid = Number(trimmed.slice(0, spaceIndex));
    const command = trimmed.slice(spaceIndex + 1).trim();

    if (!pid || ownPids.has(pid) || !isQpqCliCommand(command)) continue;
    if (getProcessCwd(pid) !== resolvedRoot) continue;

    console.log(`Killing other qpq dev process for this repo (pid ${pid}): ${command}`);
    process.kill(pid, 'SIGINT');
    if (!waitForPidGone(pid)) {
      killPidHard(pid);
    }
  }
};

export const killStaleListeners = (ports: number[], isOurs: (command: string) => boolean): void => {
  for (const port of ports) {
    let pids: number[] = [];
    try {
      pids = execSync(`lsof -t -iTCP:${port} -sTCP:LISTEN`, {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .split('\n')
        .map((line) => Number(line.trim()))
        .filter(Boolean);
    } catch {
      continue; // lsof exits non-zero when nothing is listening
    }

    for (const pid of pids) {
      let command = '';
      try {
        command = execSync(`ps -p ${pid} -o command=`).toString().trim();
      } catch {
        continue; // already gone
      }
      if (isOurs(command)) {
        console.log(`Killing stale dev server on port ${port} (pid ${pid})`);
        process.kill(pid);
        if (!waitForPidGone(pid)) {
          killPidHard(pid);
        }
      } else {
        console.warn(`Port ${port} is in use by an unrelated process (pid ${pid}: ${command}) — not killing it.`);
      }
    }
  }
};
