import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getConfigActionProcessor } from './getConfigActionProcessor';
import { getConfigGetParameterActionProcessor } from './getConfigGetParameterActionProcessor';
import { getConfigGetParametersActionProcessor } from './getConfigGetParametersActionProcessor';
import { getConfigGetSecretActionProcessor } from './getConfigGetSecretActionProcessor';
import { getConfigSetParameterActionProcessor } from './getConfigSetParameterActionProcessor';

const qpqConfig = buildTestQpqConfig();
const dynamicModuleLoader = noopDynamicModuleLoader;
const devServerConfig = buildTestDevServerConfig();

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getConfigActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getConfigGetParameterActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getConfigGetParametersActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getConfigGetSecretActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getConfigSetParameterActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getConfigActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
