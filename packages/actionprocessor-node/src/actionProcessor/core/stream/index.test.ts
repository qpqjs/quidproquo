import { buildTestQpqConfig, StreamActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getStreamActionProcessor } from './index';

describe('getStreamActionProcessor', () => {
  it('registers the read and close stream processors', async () => {
    const processors = await getStreamActionProcessor(buildTestQpqConfig(), async () => null);

    expect(Object.keys(processors).sort()).toEqual([StreamActionType.Close, StreamActionType.Read].sort());
  });
});
