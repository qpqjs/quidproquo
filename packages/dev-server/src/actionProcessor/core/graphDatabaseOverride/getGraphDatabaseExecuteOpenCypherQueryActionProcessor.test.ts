import { buildTestQpqConfig, defineGraphDatabase, GraphDatabaseActionType, noopDynamicModuleLoader } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getGraphDatabaseExecuteOpenCypherQueryActionProcessor } from './getGraphDatabaseExecuteOpenCypherQueryActionProcessor';

describe('getGraphDatabaseExecuteOpenCypherQueryActionProcessor', () => {
  it('resolves a processor function for the open cypher query action', async () => {
    const config = buildTestQpqConfig([defineGraphDatabase('myGraph', 'myVpc')]);

    const processors = await getGraphDatabaseExecuteOpenCypherQueryActionProcessor(config, noopDynamicModuleLoader);

    expect(Object.keys(processors)).toEqual([GraphDatabaseActionType.ExecuteOpenCypherQuery]);
    expect(typeof processors[GraphDatabaseActionType.ExecuteOpenCypherQuery]).toBe('function');
  });
});
