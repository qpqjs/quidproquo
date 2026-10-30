import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { buildTestDevServerConfig } from '../../__fixtures__/buildTestDevServerConfig';
import { getEmailActionProcessor } from './email';
import { getWebserverActionProcessor } from './getWebserverActionProcessor';
import { getOpenApiActionProcessor } from './openApi';
import { getServiceFunctionActionProcessor } from './serviceFunctionOverride';
import { getWebsocketActionProcessor } from './websocket';

const qpqConfig = buildTestQpqConfig();
const dynamicModuleLoader = noopDynamicModuleLoader;
const devServerConfig = buildTestDevServerConfig();

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getWebserverActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getEmailActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getOpenApiActionProcessor(qpqConfig, dynamicModuleLoader),
      getServiceFunctionActionProcessor(qpqConfig, dynamicModuleLoader),
      getWebsocketActionProcessor(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getWebserverActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
