import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  askFileGenerateTemporarySecureUrl,
  askUserScriptExecute,
  buildTestQpqConfig,
  buildTestStorySession,
  createStreamRegistry,
  createStubLogger,
  defineUserScriptRunner,
  FileActionType,
  UserScriptActionType,
} from '@qpqjs/core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { executeLambdaByName } from '../../../logic/lambda/executeLambdaByName';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getUserScriptExecuteActionProcessor } from './getUserScriptExecuteActionProcessor';

vi.mock('../../../logic/lambda/executeLambdaByName', () => ({
  executeLambdaByName: vi.fn(),
}));

const account = defineAwsServiceAccountInfo('111', 'eu-west-1');
const withRunner = buildTestQpqConfig([account, defineUserScriptRunner()]);
const withoutRunner = buildTestQpqConfig([account]);

const urlProcessors = {
  [FileActionType.GenerateTemporarySecureUrl]: async ({ drive, filepath, scope }: { drive: string; filepath: string; scope?: string }) =>
    actionResult(`https://signed.test/${drive}/${filepath}?scope=${scope ?? ''}`),
};

const payload = { drive: 'scripts', filepath: 'tenant-a/main.js', functionName: 'add', args: [20, 22], scope: 'tenant-a' };

const invoke = async (config = withRunner, actionProcessors: Record<string, unknown> = urlProcessors, args: unknown[] = payload.args) => {
  const processors = await getUserScriptExecuteActionProcessor(config, async () => null);
  return invokeProcessor(
    processors[UserScriptActionType.Execute],
    { ...payload, args },
    {
      session: buildTestStorySession(),
      actionProcessors,
      logger: createStubLogger(),
      dynamicModuleLoader: async () => null,
      streamRegistry: createStreamRegistry(),
    },
  );
};

describe('getUserScriptExecuteActionProcessor (lambda)', () => {
  beforeEach(() => {
    vi.mocked(executeLambdaByName).mockReset();
  });

  it('mints a read url for the built file and invokes the runner with it', async () => {
    vi.mocked(executeLambdaByName).mockResolvedValue({ success: true, result: 42 });

    expect(await invoke()).toEqual([42]);

    const [functionName, region, event, isAsync] = vi.mocked(executeLambdaByName).mock.calls[0];
    expect(functionName).toBe('uscript-runner-test-app-test-module-development');
    expect(region).toBe('eu-west-1');
    expect(event).toMatchObject({
      sourceUrl: 'https://signed.test/scripts/tenant-a/main.js?scope=tenant-a',
      filename: 'tenant-a/main.js',
      request: { kind: 'call', functionName: 'add', args: [20, 22] },
    });
    expect((event as { storySession: unknown }).storySession).toBeDefined();
    expect(isAsync).toBe(false);
  });

  it('refuses before minting anything when the service declares no runner', async () => {
    const [, error] = await invoke(withoutRunner);

    expect(error?.errorType).toBe(askUserScriptExecute.errorType.RunnerUnavailable);
    expect(error?.errorText).toContain('defineUserScriptRunner');
    expect(executeLambdaByName).not.toHaveBeenCalled();
  });

  it('re-labels a scope refusal from the url action', async () => {
    const refusing = {
      [FileActionType.GenerateTemporarySecureUrl]: async () =>
        actionResultError(askFileGenerateTemporarySecureUrl.errorType.InvalidScope, 'bad scope'),
    };

    const [, error] = await invoke(withRunner, refusing);

    expect(error?.errorType).toBe(askUserScriptExecute.errorType.InvalidScope);
    expect(executeLambdaByName).not.toHaveBeenCalled();
  });

  it('refuses args over the invoke limit without invoking', async () => {
    const [, error] = await invoke(withRunner, urlProcessors, ['x'.repeat(6 * 1024 * 1024)]);

    expect(error?.errorType).toBe(askUserScriptExecute.errorType.PayloadTooLarge);
    expect(executeLambdaByName).not.toHaveBeenCalled();
  });

  it('passes the runner error through with its type', async () => {
    vi.mocked(executeLambdaByName).mockResolvedValue({
      success: false,
      error: { errorType: askUserScriptExecute.errorType.FunctionNotFound, errorText: 'nope' },
    });

    const [, error] = await invoke();

    expect(error?.errorType).toBe(askUserScriptExecute.errorType.FunctionNotFound);
    expect(error?.errorText).toBe('nope');
  });

  it.each([
    ['Lambda Error: Unhandled. Details: {"errorMessage":"2026-01-01T00:01:00.000Z abc Task timed out after 60.00 seconds"}', 'TimedOut'],
    [
      'Lambda Error: Unhandled. Details: {"errorMessage":"Response payload size exceeded maximum allowed payload size (6291556 bytes)."}',
      'PayloadTooLarge',
    ],
    ['RequestEntityTooLargeException: Request must be smaller than 6291456 bytes', 'PayloadTooLarge'],
    ['ResourceNotFoundException: Function not found', 'RunnerUnavailable'],
  ])('classifies an invoke failure [%s] as %s', async (message, expected) => {
    vi.mocked(executeLambdaByName).mockRejectedValue(new Error(message));

    const [, error] = await invoke();

    expect(error?.errorType).toBe(askUserScriptExecute.errorType[expected as 'TimedOut']);
  });

  it('treats an answer without a result as the runner being unavailable', async () => {
    vi.mocked(executeLambdaByName).mockResolvedValue(undefined);

    const [, error] = await invoke();

    expect(error?.errorType).toBe(askUserScriptExecute.errorType.RunnerUnavailable);
  });
});
