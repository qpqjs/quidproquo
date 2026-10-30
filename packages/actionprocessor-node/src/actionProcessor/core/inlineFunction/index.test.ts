import { InlineFunctionActionType } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getInlineFunctionActionProcessor } from './getInlineFunctionActionProcessor';

describe('getInlineFunctionActionProcessor', () => {
  it('registers the inline function execute processor', async () => {
    const processors = await getInlineFunctionActionProcessor(buildTestQpqConfig(), async () => null);

    expect(Object.keys(processors)).toEqual([InlineFunctionActionType.Execute]);
  });
});
