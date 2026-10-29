import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { getUserScriptActionProcessor } from './getUserScriptActionProcessor';
import { getUserScriptExecuteActionProcessor } from './getUserScriptExecuteActionProcessor';
import { getUserScriptListExportsActionProcessor } from './getUserScriptListExportsActionProcessor';

const qpqConfig = buildTestQpqConfig();
const dynamicModuleLoader = noopDynamicModuleLoader;
const devServerConfig = buildTestDevServerConfig();

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getUserScriptActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getUserScriptExecuteActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
      getUserScriptListExportsActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getUserScriptActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
