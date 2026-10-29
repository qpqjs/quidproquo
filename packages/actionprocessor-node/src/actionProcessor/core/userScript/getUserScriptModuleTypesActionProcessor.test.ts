import {
  askUserScriptModuleTypes,
  createStreamRegistry,
  defineUserScriptModule,
  DynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
  UserScriptActionType,
} from '@qpqjs/core';
import { buildTestQpqConfig, createStubLogger } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getUserScriptModuleTypesActionProcessor } from './getUserScriptModuleTypesActionProcessor';

const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as any;
const TYPES_RUNTIME = '/../sdk/v1.ts?qpq-user-script-module-types::declarations';

const config = buildTestQpqConfig([
  defineUserScriptModule('my-sdk/v1', '/entry/scriptModules::mySdkV1', { types: '/../sdk/v1.ts' }),
  // No types declared: left out of the answer.
  defineUserScriptModule('plain/v1', '/entry/scriptModules::plainV1'),
]);

const invoke = async (loader: DynamicModuleLoader) => {
  const processors = await getUserScriptModuleTypesActionProcessor(config, loader);
  const process = processors[UserScriptActionType.ModuleTypes] as (p: any, ...rest: any[]) => Promise<any>;
  return process(undefined, session, {}, createStubLogger(), undefined, loader, createStreamRegistry());
};

describe('getUserScriptModuleTypesActionProcessor', () => {
  it('answers each module that declared types with its declarations, through the dynamic module loader', async () => {
    const loader: DynamicModuleLoader = async (runtime) => (runtime === TYPES_RUNTIME ? 'export declare const x: number;' : null);

    expect(resolveActionResult(await invoke(loader))).toEqual([{ moduleName: 'my-sdk/v1', declarations: 'export declare const x: number;' }]);
  });

  it('returns TypesNotFound when a declared types entry does not load as text', async () => {
    const error = resolveActionResultError(await invoke(async () => null));

    expect(error.errorType).toBe(askUserScriptModuleTypes.errorType.TypesNotFound);
    expect(error.errorText).toContain('my-sdk/v1');
  });
});
