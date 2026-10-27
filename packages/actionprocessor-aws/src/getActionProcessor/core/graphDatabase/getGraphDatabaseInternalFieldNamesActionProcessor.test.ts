import { GraphDatabaseActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getGraphDatabaseInternalFieldNamesActionProcessor } from './getGraphDatabaseInternalFieldNamesActionProcessor';

describe('getProcessInternalFieldNames', () => {
  it('returns the neptune internal field name mapping', async () => {
    const processor = (await getGraphDatabaseInternalFieldNamesActionProcessor({} as never, null as any))[GraphDatabaseActionType.InternalFieldNames];

    const [result] = await invokeProcessor(processor, {});

    expect(result).toEqual({
      internalEndNode: '`~end`',
      internalId: '`~id`',
      internalLabel: '`~label`',
      internalStartNode: '`~start`',
      internalType: '`~type`',
    });
  });
});
