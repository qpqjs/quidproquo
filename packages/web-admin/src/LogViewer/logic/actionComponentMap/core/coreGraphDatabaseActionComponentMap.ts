import { GraphDatabaseActionType } from 'quidproquo-core';

const coreGraphDatabaseActionComponentMap: Record<string, string[]> = {
  [GraphDatabaseActionType.ExecuteOpenCypherQuery]: [
    'askGraphDatabaseExecuteOpenCypherQuery',
    'graphDatabaseName',
    'instance',
    'openCypherQuery',
    'params',
  ],
  [GraphDatabaseActionType.InternalFieldNames]: ['askGraphDatabaseInternalFieldNames'],
};

export default coreGraphDatabaseActionComponentMap;
