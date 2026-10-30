import { GraphDatabaseActionType } from '@qpqjs/core';
import { invokeProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getGraphDatabaseInternalFieldNamesActionProcessor } from './getGraphDatabaseInternalFieldNamesActionProcessor';

describe('getProcessInternalFieldNames', () => {
  it('returns the neptune internal field name mapping', async () => {
    const processor = (await getGraphDatabaseInternalFieldNamesActionProcessor({} as never, null as any))[GraphDatabaseActionType.InternalFieldNames];

    const [result] = await invokeProcessor(processor!, {});

    expect(result).toEqual({
      internalEndNode: '`~end`',
      internalId: '`~id`',
      internalLabel: '`~label`',
      internalStartNode: '`~start`',
      internalType: '`~type`',
    });
  });
});
