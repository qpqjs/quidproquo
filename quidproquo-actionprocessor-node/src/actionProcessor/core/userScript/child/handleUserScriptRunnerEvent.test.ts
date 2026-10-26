import {
  askUserScriptExecute,
  askUserScriptListExports,
  buildTestQpqConfig,
  defineUserScriptModule,
  DynamicModuleLoader,
  FileActionType,
  StorySession,
  UserScriptRunnerEvent,
  UserScriptRunnerRequest,
  UserScriptRunnerRequestKind,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { handleUserScriptRunnerEvent } from './handleUserScriptRunnerEvent';

const SCRIPT = `
  const { askNewGuid, askFileReadTextContents } = require('quidproquo-core');
  exports.add = (a, b) => a + b;
  exports.stamped = function* (text) { const id = yield* askNewGuid(); return text + ':' + id.length; };
  exports.readsAFile = function* () { return yield* askFileReadTextContents('secrets', 'keys.txt'); };
  exports.shouts = (text) => require('my-sdk/v1').shout(text);
`;

const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as unknown as StorySession;
const SDK_RUNTIME = '/entry/scriptModules::mySdkV1';
const qpqConfig = buildTestQpqConfig([defineUserScriptModule('my-sdk/v1', SDK_RUNTIME)]);
const sdkLoader: DynamicModuleLoader = async (runtime) => (runtime === SDK_RUNTIME ? { shout: (text: string) => `${text.toUpperCase()}!` } : null);

const eventFor = (request: UserScriptRunnerRequest): UserScriptRunnerEvent => ({
  sourceUrl: 'https://example.test/main.js',
  filename: 'tenant-a/main.js',
  storySession: session,
  request,
});

const fetchScript = async () => SCRIPT;
const handle = (functionName: string, args: unknown[] = [], fetchSource = fetchScript) =>
  handleUserScriptRunnerEvent(eventFor({ kind: UserScriptRunnerRequestKind.call, functionName, args }), qpqConfig, sdkLoader, fetchSource);
const list = (fetchSource = fetchScript) =>
  handleUserScriptRunnerEvent(eventFor({ kind: UserScriptRunnerRequestKind.listExports }), qpqConfig, sdkLoader, fetchSource);

describe('handleUserScriptRunnerEvent', () => {
  it('fetches the script and returns a plain export result', async () => {
    expect(await handle('add', [20, 22])).toEqual({ success: true, result: 42 });
  });

  it('drives a story export with the pure processors', async () => {
    expect(await handle('stamped', ['x'])).toEqual({ success: true, result: 'x:36' });
  });

  it('hands the script the service modules', async () => {
    expect(await handle('shouts', ['hi'])).toEqual({ success: true, result: 'HI!' });
  });

  it('fails a story at the first action that needs a resource', async () => {
    const result = await handle('readsAFile');

    expect(result.success).toBe(false);
    expect(result.error?.errorText).toContain(`Unable to process action: ${FileActionType.ReadTextContents}`);
  });

  it('reports ScriptNotFound when the source url does not serve the script', async () => {
    const result = await handle('add', [], async () => {
      throw new Error('source url answered 403');
    });

    expect(result.success).toBe(false);
    expect(result.error?.errorType).toBe(askUserScriptExecute.errorType.ScriptNotFound);
    expect(result.error?.errorText).toContain('403');
  });

  it('maps a missing export onto the execute catalog', async () => {
    const result = await handle('nope');

    expect(result.error?.errorType).toBe(askUserScriptExecute.errorType.FunctionNotFound);
  });

  it('lists the exports without calling any, with the service modules available', async () => {
    expect(await list()).toEqual({ success: true, result: { functions: ['add', 'stamped', 'readsAFile', 'shouts'], nonFunctions: [] } });
  });

  it("reports a list request's load failure in the list action's catalog", async () => {
    const result = await list(async () => `require('fs');`);

    expect(result.error?.errorType).toBe(askUserScriptListExports.errorType.ModuleNotFound);

    const unfetchable = await list(async () => {
      throw new Error('source url answered 404');
    });
    expect(unfetchable.error?.errorType).toBe(askUserScriptListExports.errorType.ScriptNotFound);
  });
});
