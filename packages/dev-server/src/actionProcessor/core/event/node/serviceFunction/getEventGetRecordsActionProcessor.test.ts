import { EventActionType, resolveActionResult } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

describe('getEventGetRecordsActionProcessor (node service function)', () => {
  it('maps the function name and payload into an internal record', async () => {
    const processors = await getEventGetRecordsActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const process = processors[EventActionType.GetRecords];

    const result = await invokeProcessor(process!, { eventParams: [{ functionName: 'doThing', payload: [1, 2] }] } as any);

    expect(resolveActionResult(result)).toEqual([{ functionName: 'doThing', payload: [1, 2] }]);
  });
});
