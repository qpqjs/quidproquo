import { runUserScriptInChild } from '@qpqjs/actionprocessor-node';
import { DynamicModuleLoader, QPQConfig, UserScriptRunnerEvent, UserScriptRunnerResult } from '@qpqjs/core';

import { Context, SNSEvent } from 'aws-lambda';
import path from 'path';

import { getUserScriptRunnerChildEnv } from './helpers/getUserScriptRunnerChildEnv';
import { isSnsWarmerRecord } from './helpers/isSnsWarmerRecord';

// Headroom under the lambda deadline so the parent can kill the child and answer
// Timeout itself, rather than the platform timing the whole invoke out.
const DEADLINE_MARGIN_MS = 1500;

const isSnsEvent = (event: unknown): event is SNSEvent => Array.isArray((event as SNSEvent)?.Records);

/**
 * The child bundle beside this handler: lambda unpacks the runner's folder at its task root,
 * and the `userScriptRunnerEvent_userScript/child` entry is built into `child/index.js` in it.
 */
export const getRunnerChildModulePath = (env: NodeJS.ProcessEnv = process.env): string => {
  if (!env.LAMBDA_TASK_ROOT) {
    throw new Error('User script runner: LAMBDA_TASK_ROOT is not set, so the child bundle cannot be located');
  }
  return path.join(env.LAMBDA_TASK_ROOT, 'child', 'index.js');
};

export type UserScriptRunnerHandlerOptions = {
  childModulePath?: string;
};

/**
 * The sandboxed runner's handler. Nothing of the script runs here: each invoke forks a
 * fresh child (the child bundle beside this one) that fetches and runs the script, so a warm
 * container never carries one script's globals or /tmp into the next. Warmer pings answer
 * without forking.
 */
export const getUserScriptRunnerEvent_userScript = (
  _dynamicModuleLoader: DynamicModuleLoader,
  qpqConfig: QPQConfig,
  options: UserScriptRunnerHandlerOptions = {},
) => {
  return async (event: UserScriptRunnerEvent | SNSEvent, context: Context): Promise<UserScriptRunnerResult | string> => {
    if (isSnsEvent(event)) {
      if (event.Records.some(isSnsWarmerRecord)) {
        return 'Warmed up!';
      }
      return { success: false, error: { errorType: 'RunnerUnavailable', errorText: 'User script runner received an event it does not handle' } };
    }

    return runUserScriptInChild({
      modulePath: options.childModulePath ?? getRunnerChildModulePath(),
      event,
      timeoutMs: Math.max(context.getRemainingTimeInMillis() - DEADLINE_MARGIN_MS, 1000),
      env: getUserScriptRunnerChildEnv(),
    });
  };
};
