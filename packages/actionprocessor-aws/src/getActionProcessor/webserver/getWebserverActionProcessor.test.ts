import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEmailActionProcessor } from './email';
import { getWebserverActionProcessor } from './getWebserverActionProcessor';
import { getServiceFunctionActionProcessor } from './serviceFunction';
import { getWebEntryActionProcessor } from './webEntry';
import { getWebsocketActionProcessor } from './websocket';

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
const dynamicModuleLoader = noopDynamicModuleLoader;

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getWebserverActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getEmailActionProcessor(qpqConfig, dynamicModuleLoader),
      getWebEntryActionProcessor(qpqConfig, dynamicModuleLoader),
      getServiceFunctionActionProcessor(qpqConfig, dynamicModuleLoader),
      getWebsocketActionProcessor(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getWebserverActionProcessor(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
