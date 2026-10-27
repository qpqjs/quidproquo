import { DynamicModuleLoader, GraphDatabaseActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getGraphDatabaseExecuteOpenCypherQueryActionProcessor } from './getGraphDatabaseExecuteOpenCypherQueryActionProcessor';

const unusedModuleLoader: DynamicModuleLoader = () => Promise.resolve(null);

describe('getGraphDatabaseExecuteOpenCypherQueryActionProcessor', () => {
  it('resolves a processor for the ExecuteOpenCypherQuery action', async () => {
    const processors = await getGraphDatabaseExecuteOpenCypherQueryActionProcessor([], unusedModuleLoader);

    expect(typeof processors[GraphDatabaseActionType.ExecuteOpenCypherQuery]).toBe('function');
  });
});
