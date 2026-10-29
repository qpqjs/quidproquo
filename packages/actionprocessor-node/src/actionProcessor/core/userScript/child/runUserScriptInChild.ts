import { askUserScriptExecuteBase, UserScriptRunnerEvent, UserScriptRunnerResult } from '@qpqjs/core';

import { ChildProcess, fork } from 'child_process';

const { errorType } = askUserScriptExecuteBase;

export type RunUserScriptInChildInput = {
  // The module to fork; it must call runUserScriptChildMain.
  modulePath: string;
  event: UserScriptRunnerEvent;
  timeoutMs: number;
  // The child's whole environment. The caller builds it, leaving out whatever its platform
  // puts in the parent's that a script must not see (credentials above all).
  env: NodeJS.ProcessEnv;
  // Command-line arguments for the child, for a module that serves more than one service.
  args?: readonly string[];
};

const failed = (type: string, errorText: string): UserScriptRunnerResult => ({ success: false, error: { errorType: type, errorText } });

// SIGKILL to the child's whole process group (it leads its own, see `detached`), because a
// script can ignore SIGTERM and can spawn processes that would outlive it. A group kill
// is not available everywhere; the plain kill is the fallback.
const killProcessGroup = (child: ChildProcess): void => {
  if (child.pid === undefined) {
    return;
  }
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    child.kill('SIGKILL');
  }
};

/**
 * Runs one script call in a fresh child process and resolves with its answer. The child
 * gets only the given environment, and it and everything it started are killed once it has
 * answered or when `timeoutMs` passes, so nothing a script does can outlive the call or
 * leak into the next one. The answer is only resolved once the child is gone. Never rejects:
 * every failure of the child itself becomes a Timeout or RunnerUnavailable result.
 */
export const runUserScriptInChild = (input: RunUserScriptInChildInput): Promise<UserScriptRunnerResult> =>
  new Promise((resolve) => {
    const child = fork(input.modulePath, [...(input.args ?? [])], {
      env: input.env,
      serialization: 'json',
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
      // Its own process group, so the kill below reaches what the script spawned too.
      detached: true,
    });

    let settled = false;
    let answer: UserScriptRunnerResult | undefined;
    const settle = (result: UserScriptRunnerResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      killProcessGroup(child);
      settle(answer ?? failed(errorType.Timeout, `User script did not finish within ${input.timeoutMs}ms`));
    }, input.timeoutMs);

    child.on('message', (message) => {
      answer = message as UserScriptRunnerResult;
      killProcessGroup(child);
    });
    child.on('error', (error) => settle(failed(errorType.RunnerUnavailable, `User script runner could not start: ${error.message}`)));
    child.on('exit', (code, signal) =>
      settle(answer ?? failed(errorType.RunnerUnavailable, `User script runner exited before answering (code ${code}, signal ${signal})`)),
    );

    child.send(input.event);
  });
