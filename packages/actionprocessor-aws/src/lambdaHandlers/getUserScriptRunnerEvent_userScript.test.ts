import { buildTestQpqConfig, StorySession, UserScriptRunnerEvent, UserScriptRunnerRequestKind } from '@qpqjs/core';

import { Context, SNSEvent } from 'aws-lambda';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import { getRunnerChildModulePath, getUserScriptRunnerEvent_userScript } from './getUserScriptRunnerEvent_userScript';

const qpqConfig = buildTestQpqConfig();
const childModulePath = path.join(
  __dirname,
  '../../../actionprocessor-node/src/actionProcessor/core/userScript/child/__fixtures__/fakeRunnerChild.js',
);
const context = { getRemainingTimeInMillis: () => 10000 } as Context;
const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as unknown as StorySession;

const handler = getUserScriptRunnerEvent_userScript(async () => null, qpqConfig, { childModulePath });

describe('getUserScriptRunnerEvent_userScript', () => {
  afterEach(() => {
    delete process.env.AWS_SESSION_TOKEN;
  });

  it('runs the call in a child without the AWS variables and returns its answer', async () => {
    process.env.AWS_SESSION_TOKEN = 'secret';
    const event: UserScriptRunnerEvent = {
      sourceUrl: 'https://x.test/main.js',
      filename: 'main.js',
      storySession: session,
      request: { kind: UserScriptRunnerRequestKind.call, functionName: 'echo', args: [7] },
    };

    const result = await handler(event, context);

    expect(result).toMatchObject({ success: true, result: { echoed: [7] } });
    expect((result as { result: { env: string[] } }).result.env).not.toContain('AWS_SESSION_TOKEN');
  });

  it('answers a warmer ping without forking', async () => {
    const warmer = {
      Records: [{ EventSource: 'aws:sns', Sns: { Message: JSON.stringify({ type: 'QpqLambdaWarmerEvent' }) } }],
    } as unknown as SNSEvent;

    expect(await handler(warmer, context)).toBe('Warmed up!');
  });

  it('times a hanging script out before the lambda deadline', async () => {
    const event: UserScriptRunnerEvent = {
      sourceUrl: 'https://x.test/main.js',
      filename: 'main.js',
      storySession: session,
      request: { kind: UserScriptRunnerRequestKind.call, functionName: 'hang', args: [] },
    };

    const result = await handler(event, { getRemainingTimeInMillis: () => 1800 } as Context);

    expect(result).toMatchObject({ success: false, error: { errorType: expect.stringContaining('TimedOut') } });
  });
});

describe('getRunnerChildModulePath', () => {
  it("names the child bundle under lambda's task root", () => {
    expect(getRunnerChildModulePath({ LAMBDA_TASK_ROOT: '/var/task' })).toBe('/var/task/child/index.js');
  });

  it('refuses to guess outside lambda', () => {
    expect(() => getRunnerChildModulePath({})).toThrow('LAMBDA_TASK_ROOT');
  });
});
