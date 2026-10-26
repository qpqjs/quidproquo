import {
  askDateNow,
  askFileReadTextContents,
  askNewGuid,
  buildTestQpqConfig,
  createRuntime,
  createStubLogger,
  DateActionType,
  FileActionType,
  GuidActionType,
  NetworkActionType,
  QpqRuntimeType,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getUserScriptRunnerActionProcessors } from './getUserScriptRunnerActionProcessors';

const qpqConfig = buildTestQpqConfig();
const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as any;

const runInSandbox = (story: () => Generator<any, any, any>) =>
  createRuntime(
    qpqConfig,
    session,
    getUserScriptRunnerActionProcessors,
    () => '2026-01-01T00:00:00.000Z',
    createStubLogger(),
    'runner::test',
    QpqRuntimeType.EXECUTE_STORY,
    async () => null,
  )(story, []);

describe('getUserScriptRunnerActionProcessors', () => {
  it('serves the pure actions and network requests, nothing that reaches a resource', async () => {
    const processors = await getUserScriptRunnerActionProcessors(qpqConfig, async () => null);

    expect(processors[DateActionType.Now]).toBeTypeOf('function');
    expect(processors[GuidActionType.New]).toBeTypeOf('function');
    expect(processors[NetworkActionType.Request]).toBeTypeOf('function');
    expect(Object.keys(processors).some((type) => type.includes('/File/') || type.includes('/KeyValueStore/') || type.includes('/Config/'))).toBe(
      false,
    );
  });

  it('runs a story made of pure actions', async () => {
    const result = await runInSandbox(function* () {
      const guid = yield* askNewGuid();
      const now = yield* askDateNow();
      return { guidLength: guid.length, now: typeof now };
    });

    expect(result.error).toBeUndefined();
    expect(result.result).toEqual({ guidLength: 36, now: 'string' });
  });

  it('fails a story at its first action that needs a resource, naming the action', async () => {
    const result = await runInSandbox(function* () {
      return yield* askFileReadTextContents('secrets', 'keys.txt');
    });

    expect(result.error?.errorText).toContain(`Unable to process action: ${FileActionType.ReadTextContents}`);
  });
});
