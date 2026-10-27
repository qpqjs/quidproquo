import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { killChildWithEscalation } from './killChildWithEscalation';

// Enough of a ChildProcess to drive the helper: it only ever signals, listens
// for exit, and reads the two fields that say whether the child is already
// gone.
const createFakeChild = () => {
  const emitter = new EventEmitter();

  const child = Object.assign(emitter, {
    exitCode: null as number | null,
    signalCode: null as string | null,
    kill: vi.fn(),
  });

  const exit = () => {
    child.exitCode = 0;
    emitter.emit('exit', 0, null);
  };

  return { child: child as unknown as ChildProcess, kill: child.kill, exit };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('killChildWithEscalation', () => {
  it('sends SIGTERM and resolves when the child exits', async () => {
    const { child, kill, exit } = createFakeChild();

    const killed = killChildWithEscalation(child);

    expect(kill).toHaveBeenCalledWith('SIGTERM');

    exit();

    await expect(killed).resolves.toBeUndefined();
  });

  it('escalates to SIGKILL when the child does not exit in time', async () => {
    const { child, kill } = createFakeChild();

    void killChildWithEscalation(child, 6000);

    await vi.advanceTimersByTimeAsync(5999);
    expect(kill).not.toHaveBeenCalledWith('SIGKILL');

    await vi.advanceTimersByTimeAsync(1);
    expect(kill).toHaveBeenCalledWith('SIGKILL');
  });

  it('does not escalate when the child exits inside the grace window', async () => {
    const { child, kill, exit } = createFakeChild();

    const killed = killChildWithEscalation(child, 6000);

    await vi.advanceTimersByTimeAsync(100);
    exit();
    await killed;

    await vi.advanceTimersByTimeAsync(10000);

    expect(kill).not.toHaveBeenCalledWith('SIGKILL');
  });

  it('resolves without signalling a child that has already exited', async () => {
    const { child, kill, exit } = createFakeChild();

    exit();

    await expect(killChildWithEscalation(child)).resolves.toBeUndefined();
    expect(kill).not.toHaveBeenCalled();
  });
});
