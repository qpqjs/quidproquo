import {
  actionResult,
  actionResultError,
  askFileGenerateTemporarySecureUrl,
  askUserScriptExecute,
  createStreamRegistry,
  defineUserScriptRunner,
  FileActionType,
  UserScriptActionType,
} from '@qpqjs/core';
import { buildTestQpqConfig, buildTestStorySession, createStubLogger } from '@qpqjs/testing';

import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import { ResolvedDevServerConfig } from '../../../types';
import { getUserScriptExecuteActionProcessor } from './getUserScriptExecuteActionProcessor';

// The node package's stand-in child answers by function name: `echo` reports its args, argv and env keys.
const childModulePath = path.join(
  __dirname,
  '../../../../../actionprocessor-node/src/actionProcessor/core/userScript/child/__fixtures__/fakeRunnerChild.js',
);

const devServerConfig = (userScriptChildModulePath?: string) =>
  ({ userScriptChildModulePath, fileStorageConfig: { secureUrlPort: 3001 } }) as unknown as ResolvedDevServerConfig;

const withRunner = buildTestQpqConfig([defineUserScriptRunner({ timeoutInSeconds: 5 })]);
const withoutRunner = buildTestQpqConfig();

const urlProcessors = {
  [FileActionType.GenerateTemporarySecureUrl]: async ({ drive, filepath }: { drive: string; filepath: string }) =>
    actionResult(`http://public.example:9999/files/${drive}/${filepath}?token=t`),
};

const payload = { drive: 'scripts', filepath: 'tenant-a/main.js', functionName: 'echo', args: [20, 22] };

const invoke = async (
  config = withRunner,
  dev = devServerConfig(childModulePath),
  actionProcessors: Record<string, unknown> = urlProcessors,
  functionName = 'echo',
) => {
  const processors = await getUserScriptExecuteActionProcessor(dev)(config, async () => null);
  const process = processors[UserScriptActionType.Execute] as (p: any, ...rest: any[]) => Promise<any>;
  return process(
    { ...payload, functionName },
    buildTestStorySession(),
    actionProcessors,
    createStubLogger(),
    () => {},
    async () => null,
    createStreamRegistry(),
  );
};

describe('getUserScriptExecuteActionProcessor (dev server)', () => {
  afterEach(() => {
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  it('runs the call in the child bundle for the calling service, without AWS variables', async () => {
    process.env.AWS_SECRET_ACCESS_KEY = 'secret';

    const [result, error] = await invoke();

    expect(error).toBeUndefined();
    expect(result.echoed).toEqual([20, 22]);
    expect(result.argv).toEqual(['test-module']);
    expect(result.env).not.toContain('AWS_SECRET_ACCESS_KEY');
  });

  it('refuses like lambda when the service declares no runner', async () => {
    const [, error] = await invoke(withoutRunner);

    expect(error?.errorType).toBe(askUserScriptExecute.errorType.RunnerUnavailable);
    expect(error?.errorText).toContain('defineUserScriptRunner');
  });

  it('refuses when the server was started without the child bundle', async () => {
    const [, error] = await invoke(withRunner, devServerConfig(undefined));

    expect(error?.errorType).toBe(askUserScriptExecute.errorType.RunnerUnavailable);
    expect(error?.errorText).toContain('child bundle');
  });

  it('re-labels a scope refusal from the url action', async () => {
    const refusing = {
      [FileActionType.GenerateTemporarySecureUrl]: async () =>
        actionResultError(askFileGenerateTemporarySecureUrl.errorType.InvalidScope, 'bad scope'),
    };

    const [, error] = await invoke(withRunner, devServerConfig(childModulePath), refusing);

    expect(error?.errorType).toBe(askUserScriptExecute.errorType.InvalidScope);
  });

  it('passes a child failure through with its type', async () => {
    const [, error] = await invoke(withRunner, devServerConfig(childModulePath), urlProcessors, 'die');

    expect(error?.errorType).toBe(askUserScriptExecute.errorType.RunnerUnavailable);
    expect(error?.errorText).toContain('code 3');
  });
});
