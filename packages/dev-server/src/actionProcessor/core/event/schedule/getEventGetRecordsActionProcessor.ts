import { actionResult, askEventGetRecordsBase, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { EventInput } from './types';

// The ticker builds the record in its final shape (it knows the firing time
// and the schedule's metadata), so this is a passthrough where the lambda
// processor has to pick an EventBridge event apart.
const getProcessGetRecords = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetRecordsBase> => {
  // Registered for one event source only, so the base requester's source-agnostic
  // payload is narrowed to this source's types here.
  return async ({ eventParams }) => {
    const [event] = eventParams as EventInput;

    return actionResult([event.record]);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
