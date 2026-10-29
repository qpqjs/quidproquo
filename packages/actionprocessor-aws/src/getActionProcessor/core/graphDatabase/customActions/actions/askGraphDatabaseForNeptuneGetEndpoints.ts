import { createActionRequester } from '@qpqjs/core';

import { GraphDatabaseForNeptuneActionType } from './GraphDatabaseForNeptuneActionType';

/**
 *
 */
export type GraphDatabaseEndpoints = {
  readEndpoint?: string;
  writeEndpoint?: string;
};

export const askGraphDatabaseForNeptuneGetEndpoints = createActionRequester<GraphDatabaseEndpoints>()({
  actionType: GraphDatabaseForNeptuneActionType.GetEndpoints,
  getPayload: (graphDatabaseName: string) => ({ graphDatabaseName }),
});
