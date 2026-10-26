import { askUserScriptExecuteBase, UserScriptRunnerEvent, UserScriptRunnerResult } from 'quidproquo-core';

import { fork } from 'child_process';

const { errorType } = askUserScriptExecuteBase;

export type RunUserScriptInChildInput = {
  // The module to fork; it must call runUserScriptChildMain.
  modulePath: string;
  event: UserScriptRunnerEvent;
  timeoutMs: number;
  // The child's whole environment. The caller builds it, leaving out whatever its platform
  // puts in the parent's that a script must not see (credentials above all).
  env: NodeJS.ProcessEnv;
};

const failed = (type: string, errorText: string): UserScriptRunnerResult => ({ success: false, error: { errorType: type, errorText } });

/**
 * Runs one script call in a fresh child process and resolves with its answer. The child
 * gets only the given environment and is killed when `timeoutMs` passes, so nothing a script
 * does can outlive the call or leak into the next one. Never rejects: every failure of the
 * child itself becomes a TimedOut or RunnerUnavailable result.
 */
export const runUserScriptInChild = (input: RunUserScriptInChildInput): Promise<UserScriptRunnerResult> =>
  new Promise((resolve) => {
    const child = fork(input.modulePath, [], {
      env: input.env,
      serialization: 'json',
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    });

    let settled = false;
    const settle = (result: UserScriptRunnerResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      settle(failed(errorType.TimedOut, `User script did not finish within ${input.timeoutMs}ms`));
    }, input.timeoutMs);

    child.on('message', (message) => {
      settle(message as UserScriptRunnerResult);
      child.kill();
    });
    child.on('error', (error) => settle(failed(errorType.RunnerUnavailable, `User script runner could not start: ${error.message}`)));
    child.on('exit', (code, signal) =>
      settle(failed(errorType.RunnerUnavailable, `User script runner exited before answering (code ${code}, signal ${signal})`)),
    );

    child.send(input.event);
  });
