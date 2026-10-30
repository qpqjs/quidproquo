import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';

describe('apiGatwayEvent/api getEventAutoRespondActionProcessor', () => {
  it('registers the AutoRespond processor it wraps', async () => {
    const processors = await getEventAutoRespondActionProcessor(buildTestQpqConfig(), null as any);

    expect(Object.keys(processors)).toEqual([EventActionType.AutoRespond]);
  });
});
