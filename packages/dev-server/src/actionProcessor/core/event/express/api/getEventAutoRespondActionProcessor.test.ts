import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';

describe('getEventAutoRespondActionProcessor (express)', () => {
  it('delegates to the http api auto-respond processor map', async () => {
    const processors = await getEventAutoRespondActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);

    expect(typeof processors[EventActionType.AutoRespond]).toBe('function');
  });
});
