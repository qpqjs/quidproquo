import {
  buildTestQpqConfig,
  ErrorTypeEnum,
  EventActionType,
  isErroredActionResult,
  noopDynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';
import { defineServiceFunction } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../../../testing/testProcessorRuntime';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

const runtime = '/entry::doThing' as const;

const buildConfig = () => buildTestQpqConfig([defineServiceFunction(runtime, { functionName: 'doThing' })]);

const invoke = async (qpqConfig: any, qpqEventRecord: any) => {
  const processors = await getEventMatchStoryActionProcessor(qpqConfig, noopDynamicModuleLoader);
  const process = processors[EventActionType.MatchStory];
  return invokeProcessor(process, { qpqEventRecord } as any);
};

describe('getEventMatchStoryActionProcessor (node service function)', () => {
  it('matches a service function by name and returns its runtime', async () => {
    const result = await invoke(buildConfig(), { functionName: 'doThing' });

    expect(resolveActionResult(result).runtime).toBe(runtime);
  });

  it('returns a NotFound error when no service function matches', async () => {
    const result = await invoke(buildConfig(), { functionName: 'missing' });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.NotFound);
    expect(resolveActionResultError(result).errorText).toContain('service function not found');
  });
});
