import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventBusActionProcessor } from './getEventBusActionProcessor';
import { getEventBusSendMessagesActionProcessor } from './getEventBusSendMessagesActionProcessor';

const qpqConfig = buildTestQpqConfig();
const dynamicModuleLoader = noopDynamicModuleLoader;

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getEventBusActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([getEventBusSendMessagesActionProcessor(qpqConfig, dynamicModuleLoader)]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getEventBusActionProcessor(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
