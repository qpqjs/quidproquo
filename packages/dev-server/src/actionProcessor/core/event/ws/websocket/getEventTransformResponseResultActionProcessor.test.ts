import {
  buildTestQpqConfig,
  ErrorTypeEnum,
  EventActionType,
  isErroredActionResult,
  noopDynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../../../testing/testProcessorRuntime';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

const invoke = async (qpqEventRecordResponses: any) => {
  const processors = await getEventTransformResponseResultActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  const process = processors[EventActionType.TransformResponseResult];
  return invokeProcessor(process, { eventParams: [], qpqEventRecordResponses } as any);
};

describe('getEventTransformResponseResultActionProcessor (websocket)', () => {
  it('returns an undefined success result', async () => {
    const result = await invoke([{ success: true, result: undefined }]);

    expect(resolveActionResult(result)).toBeUndefined();
  });

  it('returns an error action result when the record failed', async () => {
    const result = await invoke([{ success: false, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'boom', errorStack: 'stack' } }]);

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result)).toEqual({ errorType: ErrorTypeEnum.GenericError, errorText: 'boom', errorStack: 'stack' });
  });
});
