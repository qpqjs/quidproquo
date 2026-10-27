import {
  buildTestQpqConfig,
  buildTestStorySession,
  ErrorTypeEnum,
  isErroredActionResult,
  noopDynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';
import { ServiceFunctionActionType } from 'quidproquo-webserver';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { eventBus } from '../../../logic/eventBus';
import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getServiceFunctionExecuteActionProcessor } from './getServiceFunctionExecuteActionProcessor';

vi.mock('../../../logic/eventBus', () => ({
  eventBus: { publish: vi.fn(), publishAndWaitForResponse: vi.fn() },
}));

const getProcessor = async () => {
  const processors = await getServiceFunctionExecuteActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[ServiceFunctionActionType.Execute];
};

describe('getServiceFunctionExecuteActionProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('publishes an Execute event carrying functionName/serviceName/payload/storySession', async () => {
    (eventBus.publishAndWaitForResponse as any).mockResolvedValue({ result: 'ok' });
    const process = await getProcessor();

    await invokeProcessor(process, { functionName: 'doThing', service: 'svc-a', payload: { a: 1 }, isAsync: false });

    expect(eventBus.publishAndWaitForResponse).toHaveBeenCalledWith(ServiceFunctionActionType.Execute, {
      functionName: 'doThing',
      serviceName: 'svc-a',
      payload: { a: 1 },
      storySession: buildTestStorySession(),
    });
  });

  it('returns success undefined immediately and does not await the response when isAsync', async () => {
    let resolved = false;
    (eventBus.publishAndWaitForResponse as any).mockReturnValue(
      new Promise(() => {
        resolved = true;
      }),
    );
    const process = await getProcessor();

    const result = await invokeProcessor(process, { functionName: 'f', service: 's', payload: {}, isAsync: true });

    expect(resolveActionResult(result)).toBeUndefined();
    expect(resolved).toBe(true);
  });

  it('returns the response result on success when not async', async () => {
    (eventBus.publishAndWaitForResponse as any).mockResolvedValue({ result: { value: 42 } });
    const process = await getProcessor();

    const result = await invokeProcessor(process, { functionName: 'f', service: 's', payload: {}, isAsync: false });

    expect(resolveActionResult(result)).toEqual({ value: 42 });
  });

  it('returns an actionResultError carrying the response error fields when not async', async () => {
    (eventBus.publishAndWaitForResponse as any).mockResolvedValue({
      error: { errorType: ErrorTypeEnum.NotFound, errorText: 'nope', errorStack: 'stack' },
    });
    const process = await getProcessor();

    const result = await invokeProcessor(process, { functionName: 'f', service: 's', payload: {}, isAsync: false });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result)).toEqual({
      errorType: ErrorTypeEnum.NotFound,
      errorText: 'nope',
      errorStack: 'stack',
    });
  });
});
