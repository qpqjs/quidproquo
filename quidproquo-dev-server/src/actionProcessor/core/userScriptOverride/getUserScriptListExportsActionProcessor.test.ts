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
} from 'quidproquo-core';

import path from 'path';
import { describe, expect, it } from 'vitest';

import { ResolvedDevServerConfig } from '../../../types';
import { getUserScriptListExportsActionProcessor } from './getUserScriptListExportsActionProcessor';

const childModulePath = path.join(
  __dirname,
  '../../../../../quidproquo-actionprocessor-node/src/actionProcessor/core/userScript/child/__fixtures__/fakeRunnerChild.js',
);
const devServerConfig = {
  userScriptChildModulePath: childModulePath,
  fileStorageConfig: { secureUrlPort: 3001 },
} as unknown as ResolvedDevServerConfig;

const urlProcessors = {
  [FileActionType.GenerateTemporarySecureUrl]: async ({ drive, filepath }: { drive: string; filepath: string }) =>
    actionResult(`http://localhost:3001/files/${drive}/${filepath}`),
};

const invoke = async (config = buildTestQpqConfig([defineUserScriptRunner({ timeoutInSeconds: 5 })])) => {
  const processors = await getUserScriptListExportsActionProcessor(devServerConfig)(config, async () => null);
  const process = processors[UserScriptActionType.ListExports] as (p: any, ...rest: any[]) => Promise<any>;
  return process(
    { drive: 'scripts', filepath: 'a/main.js' },
    buildTestStorySession(),
    urlProcessors,
    createStubLogger(),
    () => {},
    async () => null,
    createStreamRegistry(),
  );
};

describe('getUserScriptListExportsActionProcessor (dev server)', () => {
  it('asks the child to list the exports', async () => {
    expect(await invoke()).toEqual([{ functions: ['add', 'greet'], nonFunctions: [] }]);
  });

  it('refuses in its own catalog when the service declares no runner', async () => {
    const [, error] = await invoke(buildTestQpqConfig());

    expect(error?.errorType).toBe(askUserScriptListExports.errorType.RunnerUnavailable);
  });
});
