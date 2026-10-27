import { actionResult, askEventGetRecordsBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { EventInput, InternalEventRecord } from './types';

// The local backend already builds the record in its final shape (it stores items raw and
// partitions by scope at the file level, so there is no composed key to take apart), so this
// is a passthrough rather than the unmarshal-and-decompose the DynamoDB processor does.
const getProcessGetRecords = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetRecordsBase> => {
  // Registered for one event source only, so the base requester's source-agnostic
  // payload is narrowed to this source's types here.
  return async ({ eventParams }) => {
    const [event] = eventParams as EventInput;

    return actionResult([event.record]);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
