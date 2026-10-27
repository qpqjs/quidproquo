import { describe, expect, it } from 'vitest';

import { getUserScriptRunnerChildEnv } from './getUserScriptRunnerChildEnv';

describe('getUserScriptRunnerChildEnv', () => {
  it('drops every AWS_* variable and keeps the rest', () => {
    const env = getUserScriptRunnerChildEnv({
      AWS_ACCESS_KEY_ID: 'k',
      AWS_SESSION_TOKEN: 't',
      AWS_REGION: 'r',
      PATH: '/bin',
      LAMBDA_TASK_ROOT: '/var/task',
    });

    expect(env).toEqual({ PATH: '/bin', LAMBDA_TASK_ROOT: '/var/task' });
  });
});
