import { EventEmitter } from 'events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { spawn } from 'child_process';

import { runCommand } from './runCommand';

vi.mock('child_process', () => ({ spawn: vi.fn() }));

const fakeChild = () => {
  const child = new EventEmitter();
  setImmediate(() => child.emit('exit', 0, null));
  return child as any;
};

describe('runCommand', () => {
  beforeEach(() => vi.mocked(spawn).mockReset());

  // Security regression: on posix every child runs without a shell, so a config-derived or CI-supplied
  // argument is handed to the program as one argv entry and never re-parsed as a command line.
  it.skipIf(process.platform === 'win32')('spawns without a shell and passes a shell-shaped argument through verbatim', async () => {
    vi.mocked(spawn).mockImplementation(fakeChild);
    const hostile = 'dev; rm -rf / #';

    await runCommand('npx', ['cdk', 'deploy', hostile, '', '--require-approval', 'never']);

    const [command, args, options] = vi.mocked(spawn).mock.calls[0];
    expect(command).toBe('npx');
    expect(args).toEqual(['cdk', 'deploy', hostile, '--require-approval', 'never']);
    expect(options?.shell).toBe(false);
  });

  it('rejects when the child exits non-zero', async () => {
    vi.mocked(spawn).mockImplementation(() => {
      const child = new EventEmitter();
      setImmediate(() => child.emit('exit', 2, null));
      return child as any;
    });

    await expect(runCommand('npm', ['run', 'build'])).rejects.toThrow('exited with code 2');
  });
});
