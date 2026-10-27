import { GraphDatabaseActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getGraphDatabaseExecuteOpenCypherQueryActionProcessor } from './getGraphDatabaseExecuteOpenCypherQueryActionProcessor';

describe('getGraphDatabaseExecuteOpenCypherQueryActionProcessor', () => {
  it('resolves a processor for the ExecuteOpenCypherQuery action', async () => {
    const processors = await getGraphDatabaseExecuteOpenCypherQueryActionProcessor({} as never, null as any);

    expect(typeof processors[GraphDatabaseActionType.ExecuteOpenCypherQuery]).toBe('function');
  });
});
