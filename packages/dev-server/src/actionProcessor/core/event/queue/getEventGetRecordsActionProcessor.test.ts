import { buildTestQpqConfig, EventActionType, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../../testing/testProcessorRuntime';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

describe('getEventGetRecordsActionProcessor (queue)', () => {
  it('maps the queue message and message id into an internal record', async () => {
    const processors = await getEventGetRecordsActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const process = processors[EventActionType.GetRecords];

    const result = await invokeProcessor(process, { eventParams: [{ type: 'order.created', payload: { id: 1 }, messageId: 'm-1' }] } as any);

    expect(resolveActionResult(result)).toEqual([{ message: { type: 'order.created', payload: { id: 1 } }, id: 'm-1' }]);
  });
});
