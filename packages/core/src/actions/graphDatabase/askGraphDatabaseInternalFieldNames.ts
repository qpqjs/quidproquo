import { createActionRequester } from '../../types';
import { GraphDatabaseActionType } from './GraphDatabaseActionType';

export type GraphDatabaseInternalFieldNames = {
  internalId: string;
  internalLabel: string;
  internalType: string;
  internalStartNode: string;
  internalEndNode: string;
};

export const askGraphDatabaseInternalFieldNames = createActionRequester<GraphDatabaseInternalFieldNames>()({
  actionType: GraphDatabaseActionType.InternalFieldNames,
});
