import { buildTestQpqConfig, InlineFunctionActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getInlineFunctionActionProcessor } from './index';

describe('getInlineFunctionActionProcessor', () => {
  it('registers the inline function execute processor', async () => {
    const processors = await getInlineFunctionActionProcessor(buildTestQpqConfig(), async () => null);

    expect(Object.keys(processors)).toEqual([InlineFunctionActionType.Execute]);
  });
});
