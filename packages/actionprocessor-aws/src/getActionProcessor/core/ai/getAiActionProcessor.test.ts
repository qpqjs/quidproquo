import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getAiActionProcessor } from './getAiActionProcessor';
import { getAiGetModelRegionsActionProcessor } from './getAiGetModelRegionsActionProcessor';
import { getAiPromptActionProcessor } from './getAiPromptActionProcessor';
import { getAiPromptStreamActionProcessor } from './getAiPromptStreamActionProcessor';

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
const dynamicModuleLoader = noopDynamicModuleLoader;

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getAiActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getAiPromptActionProcessor(qpqConfig, dynamicModuleLoader),
      getAiPromptStreamActionProcessor(qpqConfig, dynamicModuleLoader),
      getAiGetModelRegionsActionProcessor(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getAiActionProcessor(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
