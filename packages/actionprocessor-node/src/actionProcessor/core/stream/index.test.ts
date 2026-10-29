import { StreamActionType } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getStreamActionProcessor } from './getStreamActionProcessor';

describe('getStreamActionProcessor', () => {
  it('registers the read and close stream processors', async () => {
    const processors = await getStreamActionProcessor(buildTestQpqConfig(), async () => null);

    expect(Object.keys(processors).sort()).toEqual([StreamActionType.Close, StreamActionType.Read].sort());
  });
});
