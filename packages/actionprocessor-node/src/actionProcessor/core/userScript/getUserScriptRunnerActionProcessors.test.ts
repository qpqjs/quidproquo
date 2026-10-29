import {
  askDateNow,
  askFileReadTextContents,
  askGuidNew,
  createRuntime,
  DateActionType,
  FileActionType,
  GuidActionType,
  KeyValueStoreActionType,
  NetworkActionType,
  QpqRuntimeType,
} from '@qpqjs/core';
import { buildTestQpqConfig, createStubLogger } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getUserScriptRunnerActionProcessor } from './getUserScriptRunnerActionProcessor';

const qpqConfig = buildTestQpqConfig();
const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as any;

const runInSandbox = (story: () => Generator<any, any, any>) =>
  createRuntime(
    qpqConfig,
    session,
    getUserScriptRunnerActionProcessor,
    () => '2026-01-01T00:00:00.000Z',
    createStubLogger(),
    'runner::test',
    QpqRuntimeType.EXECUTE_STORY,
    async () => null,
  )(story, []);

describe('getUserScriptRunnerActionProcessor', () => {
  it('serves the pure actions and network requests, nothing that reaches a resource', async () => {
    const processors = await getUserScriptRunnerActionProcessor(qpqConfig, async () => null);

    expect(processors[DateActionType.Now]).toBeTypeOf('function');
    expect(processors[GuidActionType.New]).toBeTypeOf('function');
    expect(processors[NetworkActionType.Request]).toBeTypeOf('function');
    expect(Object.keys(processors).some((type) => type.includes('/File/') || type.includes('/KeyValueStore/') || type.includes('/Config/'))).toBe(
      false,
    );
  });

  // Security regression: the cross-scope scan is migration-only and must never be reachable from a user script.
  it('never serves the scan-all-scopes action', async () => {
    const processors = await getUserScriptRunnerActionProcessor(qpqConfig, async () => null);

    expect(processors[KeyValueStoreActionType.ScanAllScopes]).toBeUndefined();
    expect(processors[KeyValueStoreActionType.Scan]).toBeUndefined();
  });

  it('runs a story made of pure actions', async () => {
    const result = await runInSandbox(function* () {
      const guid = yield* askGuidNew();
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
