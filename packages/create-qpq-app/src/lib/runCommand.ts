import { spawn } from 'child_process';

export type RunCommandOptions = {
  // Working directory for the child (defaults to cwd).
  cwd?: string;
};

// Spawn a command, inheriting stdio, resolving on success. A non-zero exit
// REJECTS so a failed install/init stops the run.
export const runCommand = (command: string, args: string[], options: RunCommandOptions = {}): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: options.cwd ?? process.cwd(),
    });

    child.on('error', (error) => reject(error));

    child.on('exit', (code, signal) => {
      if (signal) return reject(new Error(`${command} was killed with signal ${signal}`));
      if (code) return reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      return resolve();
    });
  });
