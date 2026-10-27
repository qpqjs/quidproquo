import { buildTestQpqConfig, EventActionType, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../../testing/testProcessorRuntime';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

describe('getEventTransformResponseResultActionProcessor (queue)', () => {
  it('returns an undefined success result', async () => {
    const processors = await getEventTransformResponseResultActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const process = processors[EventActionType.TransformResponseResult];

    const result = await invokeProcessor(process, { eventParams: [], qpqEventRecordResponses: [] } as any);

    expect(resolveActionResult(result)).toBeUndefined();
  });
});
