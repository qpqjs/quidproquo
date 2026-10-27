import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import {
  actionResult,
  askUserScriptListExports,
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
import { getUserScriptListExportsActionProcessor } from './getUserScriptListExportsActionProcessor';

vi.mock('../../../logic/lambda/executeLambdaByName', () => ({
  executeLambdaByName: vi.fn(),
}));

const account = defineAwsServiceAccountInfo('111', 'eu-west-1');
const withRunner = buildTestQpqConfig([account, defineUserScriptRunner()]);
const withoutRunner = buildTestQpqConfig([account]);

const urlProcessors = {
  [FileActionType.GenerateTemporarySecureUrl]: async ({ drive, filepath }: { drive: string; filepath: string }) =>
    actionResult(`https://signed.test/${drive}/${filepath}`),
};

const invoke = async (config = withRunner) => {
  const processors = await getUserScriptListExportsActionProcessor(config, async () => null);
  return invokeProcessor(
    processors[UserScriptActionType.ListExports],
    { drive: 'scripts', filepath: 'a/main.js', scope: 'tenant-a' },
    {
      session: buildTestStorySession(),
      actionProcessors: urlProcessors,
      logger: createStubLogger(),
      dynamicModuleLoader: async () => null,
      streamRegistry: createStreamRegistry(),
    },
  );
};

describe('getUserScriptListExportsActionProcessor (lambda)', () => {
  beforeEach(() => {
    vi.mocked(executeLambdaByName).mockReset();
  });

  it('asks the runner to list the exports of the built file', async () => {
    const exports = { functions: ['add'], nonFunctions: ['version'] };
    vi.mocked(executeLambdaByName).mockResolvedValue({ success: true, result: exports });

    expect(await invoke()).toEqual([exports]);

    const [functionName, , event] = vi.mocked(executeLambdaByName).mock.calls[0];
    expect(functionName).toBe('uscript-runner-test-app-test-module-development');
    expect(event).toMatchObject({ sourceUrl: 'https://signed.test/scripts/a/main.js', filename: 'a/main.js', request: { kind: 'listExports' } });
  });

  it('refuses in its own catalog when the service declares no runner', async () => {
    const [, error] = await invoke(withoutRunner);

    expect(error?.errorType).toBe(askUserScriptListExports.errorType.RunnerUnavailable);
  });

  it('classifies a timeout in its own catalog', async () => {
    vi.mocked(executeLambdaByName).mockRejectedValue(new Error('Task timed out after 60.00 seconds'));

    const [, error] = await invoke();

    expect(error?.errorType).toBe(askUserScriptListExports.errorType.TimedOut);
  });
});
