import { askUserScriptExecute, StorySession, UserScriptRunnerEvent } from 'quidproquo-core';

import path from 'path';
import { describe, expect, it } from 'vitest';

import { runUserScriptInChild } from './runUserScriptInChild';

const modulePath = path.join(__dirname, '__fixtures__', 'fakeRunnerChild.js');
const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as unknown as StorySession;

const eventFor = (functionName: string, args: unknown[] = []): UserScriptRunnerEvent => ({
  sourceUrl: 'https://example.test/main.js',
  filename: 'main.js',
  functionName,
  args,
  storySession: session,
});

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

  it('kills a child that does not answer in time and reports TimedOut', async () => {
    const result = await runUserScriptInChild({ modulePath, event: eventFor('hang'), timeoutMs: 300, env: process.env });

    expect(result.success).toBe(false);
    expect(result.error?.errorType).toBe(askUserScriptExecute.errorType.TimedOut);
  });

  it('reports RunnerUnavailable when the child exits before answering', async () => {
    const result = await runUserScriptInChild({ modulePath, event: eventFor('die'), timeoutMs: 5000, env: process.env });

    expect(result.success).toBe(false);
    expect(result.error?.errorType).toBe(askUserScriptExecute.errorType.RunnerUnavailable);
    expect(result.error?.errorText).toContain('code 3');
  });

  it('reports RunnerUnavailable when the module cannot be started', async () => {
    const result = await runUserScriptInChild({
      modulePath: path.join(__dirname, 'nowhere.js'),
      event: eventFor('echo'),
      timeoutMs: 5000,
      env: process.env,
    });

    expect(result.success).toBe(false);
    expect(result.error?.errorType).toBe(askUserScriptExecute.errorType.RunnerUnavailable);
  });
});
