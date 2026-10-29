import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getGraphDatabaseActionProcessor } from './getGraphDatabaseActionProcessor';
import { getGraphDatabaseExecuteOpenCypherQueryActionProcessor } from './getGraphDatabaseExecuteOpenCypherQueryActionProcessor';

const qpqConfig = buildTestQpqConfig();
const dynamicModuleLoader = noopDynamicModuleLoader;

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getGraphDatabaseActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([getGraphDatabaseExecuteOpenCypherQueryActionProcessor(qpqConfig, dynamicModuleLoader)]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getGraphDatabaseActionProcessor(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
