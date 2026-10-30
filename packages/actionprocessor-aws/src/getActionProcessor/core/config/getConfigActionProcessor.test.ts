import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getConfigActionProcessor } from './getConfigActionProcessor';
import { getConfigGetParameterActionProcessor } from './getConfigGetParameterActionProcessor';
import { getConfigGetParametersActionProcessor } from './getConfigGetParametersActionProcessor';
import { getConfigGetSecretActionProcessor } from './getConfigGetSecretActionProcessor';
import { getConfigListParametersActionProcessor } from './getConfigListParametersActionProcessor';
import { getConfigSetParameterActionProcessor } from './getConfigSetParameterActionProcessor';

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
const dynamicModuleLoader = noopDynamicModuleLoader;

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getConfigActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getConfigGetParameterActionProcessor(qpqConfig, dynamicModuleLoader),
      getConfigGetParametersActionProcessor(qpqConfig, dynamicModuleLoader),
      getConfigGetSecretActionProcessor(qpqConfig, dynamicModuleLoader),
      getConfigListParametersActionProcessor(qpqConfig, dynamicModuleLoader),
      getConfigSetParameterActionProcessor(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getConfigActionProcessor(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
