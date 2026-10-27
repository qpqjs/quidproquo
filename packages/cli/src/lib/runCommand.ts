import { spawn } from 'child_process';
import type { Readable } from 'stream';

export type RunCommandOptions = {
  // Extra environment variables merged over the parent process env.
  env?: Record<string, string>;
  // Working directory for the child (defaults to cwd).
  cwd?: string;
  // Echo the command before running it.
  logCommand?: boolean;
};

// Spawn a command, inheriting stdio, resolving on success. A non-zero exit
// REJECTS so a failed build/deploy stops the run.
export const runCommand = (command: string, args: string[], options: RunCommandOptions = {}): Promise<void> =>
  new Promise((resolve, reject) => {
    const validArgs = args.filter((a) => !!a);

    if (options.logCommand) {
      console.log(`Running command: ${command} ${validArgs.join(' ')}`);
    }

    const child = spawn(command, validArgs, {
      stdio: 'inherit',
      // Shell only on Windows (to resolve npm/aws/cdk .cmd shims). On posix, run
      // without a shell so the already-array args are passed straight to the
      // program and can't be re-interpreted by `sh -c` — no command injection via
      // interpolated values (stack names, CI-supplied env, etc.).
      shell: process.platform === 'win32',
      cwd: options.cwd ?? process.cwd(),
      env: { ...process.env, ...(options.env ?? {}) },
    });

    child.on('error', (error) => reject(error));

    child.on('exit', (code, signal) => {
      if (signal) return reject(new Error(`${command} was killed with signal ${signal}`));
      if (code) return reject(new Error(`${command} ${validArgs.join(' ')} exited with code ${code}`));
      return resolve();
    });
  });

// Run a command for its side effect only, swallowing both its output and its
// exit code — for best-effort cleanup steps (e.g. `docker rm -f` of a container
// that may not exist) that must never fail the run. Without a shell there's no
// `>/dev/null 2>&1 || true`, so quieting and non-failing happen here instead.
export const runCommandBestEffort = (command: string, args: string[], options: RunCommandOptions = {}): Promise<void> =>
  new Promise((resolve) => {
    const validArgs = args.filter((a) => !!a);

    const child = spawn(command, validArgs, {
      stdio: 'ignore',
      shell: process.platform === 'win32',
      cwd: options.cwd ?? process.cwd(),
      env: { ...process.env, ...(options.env ?? {}) },
    });

    child.on('error', () => resolve());
    child.on('exit', () => resolve());
  });

export type RunCommandPrefixedOptions = {
  env?: Record<string, string>;
  cwd?: string;
  // ANSI color code for the prefix (see nextPrefixColor).
  color?: number;
};

const PREFIX_COLORS = [36, 32, 33, 35, 34, 96, 92, 93, 95, 94];
let colorIndex = 0;

// Hand each concurrent task a distinct prefix color so interleaved output is
// scannable.
export const nextPrefixColor = (): number => {
  const color = PREFIX_COLORS[colorIndex % PREFIX_COLORS.length];
  colorIndex += 1;
  return color;
};

// Like runCommand, but pipes output and prefixes every line with a colored
// [label] — for running many commands concurrently without unreadable
// interleaving. Rejects on non-zero exit.
export const runCommandPrefixed = (label: string, command: string, args: string[], options: RunCommandPrefixedOptions = {}): Promise<void> =>
  new Promise((resolve, reject) => {
    const validArgs = args.filter((a) => !!a);
    const prefix = `\x1b[${options.color ?? 36}m[${label}]\x1b[0m `;

    const child = spawn(command, validArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      // Shell only on Windows (to resolve npm/aws/cdk .cmd shims). On posix, run
      // without a shell so the already-array args are passed straight to the
      // program and can't be re-interpreted by `sh -c` — no command injection via
      // interpolated values (stack names, CI-supplied env, etc.).
      shell: process.platform === 'win32',
      cwd: options.cwd ?? process.cwd(),
      env: { ...process.env, ...(options.env ?? {}) },
    });

    const attach = (stream: Readable, out: NodeJS.WriteStream): void => {
      let buffered = '';
      stream.on('data', (chunk: Buffer) => {
        buffered += chunk.toString();
        const lines = buffered.split('\n');
        buffered = lines.pop() ?? '';
        lines.forEach((line) => out.write(`${prefix}${line}\n`));
      });
      stream.on('end', () => {
        if (buffered) out.write(`${prefix}${buffered}\n`);
      });
    };

    attach(child.stdout as Readable, process.stdout);
    attach(child.stderr as Readable, process.stderr);

    child.on('error', (error) => reject(error));

    child.on('exit', (code, signal) => {
      if (signal) return reject(new Error(`[${label}] ${command} was killed with signal ${signal}`));
      if (code) return reject(new Error(`[${label}] ${command} exited with code ${code}`));
      return resolve();
    });
  });
