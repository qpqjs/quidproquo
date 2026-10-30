import { askUserScriptExecute, StorySession, UserScriptRunnerEvent, UserScriptRunnerRequestKind } from '@qpqjs/core';

import path from 'path';
import { describe, expect, it, vi } from 'vitest';

import { runUserScriptInChild } from './runUserScriptInChild';

const modulePath = path.join(__dirname, '__fixtures__', 'fakeRunnerChild.js');
const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as unknown as StorySession;

const eventFor = (functionName: string, args: unknown[] = []): UserScriptRunnerEvent => ({
  sourceUrl: 'https://example.test/main.js',
  filename: 'main.js',
  storySession: session,
  request: { kind: UserScriptRunnerRequestKind.call, functionName, args },
});

// Signal 0 only checks the process exists; a reaped process is gone, a zombie or a live one is not.
const isAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
};

// Polls because the kill is delivered asynchronously and the grandchild is reaped by init.
const waitUntilDead = async (pids: number[]): Promise<boolean> => {
  try {
    await vi.waitFor(() => expect(pids.every((pid) => !isAlive(pid))).toBe(true), { timeout: 2000, interval: 50 });
    return true;
  } catch {
    return false;
  }
};

describe('runUserScriptInChild', () => {
  it('forks the module with exactly the given environment and returns its answer', async () => {
    const result = await runUserScriptInChild({
      modulePath,
      event: eventFor('echo', [1, 'two']),
      timeoutMs: 5000,
      env: { PATH: process.env.PATH, MARKER: 'yes' },
      args: ['my-service'],
    });

    expect(result).toMatchObject({ success: true, result: { echoed: [1, 'two'], argv: ['my-service'] } });
    // The OS may add a variable or two of its own; nothing of the parent's beyond the given keys gets through.
    const env = (result as { result: { env: string[] } }).result.env;
    expect(env).toContain('MARKER');
    expect(env).not.toContain('HOME');
  });

  it('kills a child that does not answer in time and reports Timeout', async () => {
    const result = await runUserScriptInChild({ modulePath, event: eventFor('hang'), timeoutMs: 300, env: process.env });

    expect(result.success).toBe(false);
    expect(result.error?.errorType).toBe(askUserScriptExecute.errorType.Timeout);
  });

  it('kills the child and what it spawned once it has answered, even when they ignore SIGTERM', async () => {
    const result = await runUserScriptInChild({ modulePath, event: eventFor('survive'), timeoutMs: 5000, env: process.env });
    expect(result.success).toBe(true);
    const { pid, grandchildPid } = (result as { result: { pid: number; grandchildPid: number } }).result;
    expect(await waitUntilDead([pid, grandchildPid])).toBe(true);
  });

  it('reports RunnerUnavailable when the child exits before answering', async () => {
    const result = await runUserScriptInChild({ modulePath, event: eventFor('die'), timeoutMs: 5000, env: process.env });

    expect(result.success).toBe(false);
    expect(result.error?.errorType).toBe(askUserScriptExecute.errorType.RunnerUnavailable);
    expect(result.error?.errorText).toContain('code 3');
  });

  it('reports RunnerUnavailable when the module cannot be started', async () => {
    // The child prints node's "cannot find module" error before exiting; that is the failure under
    // test, not noise worth seeing in the run.
    const result = await runUserScriptInChild({
      modulePath: path.join(__dirname, 'nowhere.js'),
      event: eventFor('echo'),
      timeoutMs: 5000,
      env: process.env,
      output: 'ignore',
    });

    expect(result.success).toBe(false);
    expect(result.error?.errorType).toBe(askUserScriptExecute.errorType.RunnerUnavailable);
  });
});
