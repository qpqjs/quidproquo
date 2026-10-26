import { spawn } from 'node:child_process';

// Runs INSIDE the sandbox, as a hostile script would: swallows the runner's polite kill, keeps
// the sandbox process from exiting on its own, and starts a plain grandchild (same process
// group, not detached) that holds a loopback port open. A later call in the same runner then
// checks whether any of it is still alive. Returns the grandchild's pid.
export const spawnSurvivor = (port: number): number => {
  process.on('SIGTERM', () => {});
  process.exit = (() => {}) as typeof process.exit;
  const listener = `require('node:net').createServer((socket) => socket.end('alive')).listen(${port}, '127.0.0.1'); setInterval(() => {}, 60000);`;
  const grandchild = spawn(process.execPath, ['-e', listener], {
    stdio: 'ignore',
  });
  return grandchild.pid ?? -1;
};
