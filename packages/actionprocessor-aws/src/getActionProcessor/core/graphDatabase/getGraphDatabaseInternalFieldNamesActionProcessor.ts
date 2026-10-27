import {
  actionResult,
  askGraphDatabaseInternalFieldNames,
  createActionProcessor,
  GraphDatabaseActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

const getProcessInternalFieldNames = (qpqConfig: QPQConfig): ProcessorFor<typeof askGraphDatabaseInternalFieldNames> => {
  return async () => {
    return actionResult({
      internalEndNode: '`~end`',
      internalId: '`~id`',
      internalLabel: '`~label`',
      internalStartNode: '`~start`',
      internalType: '`~type`',
    });
  };
};

export const getGraphDatabaseInternalFieldNamesActionProcessor = createActionProcessor(
  askGraphDatabaseInternalFieldNames,
  getProcessInternalFieldNames,
);
