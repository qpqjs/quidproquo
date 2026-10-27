import { actionResult, askEventGetRecordsBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { EventInput, InternalEventRecord } from './types';

const getProcessGetRecords = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetRecordsBase> => {
  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [eventBridgeEvent, context] = eventParams as EventInput;

    const internalEventRecord: InternalEventRecord = {
      time: eventBridgeEvent.time,
      correlation: context.awsRequestId,
      metadata: eventBridgeEvent.detail,
    };

    return actionResult([internalEventRecord]);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
