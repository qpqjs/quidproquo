import {
  actionResult,
  askEventTransformResponseResultBase,
  createActionProcessor,
  EitherActionResult,
  EventActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { SQSBatchItemFailure } from 'aws-lambda';

import { EventInput, EventOutput, InternalEventOutput, InternalEventRecord } from './types';

const getProcessTransformResponseResult = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventTransformResponseResultBase> => {
  // We might need to JSON.stringify the body.
  return async ({ eventParams: rawEventParams, qpqEventRecordResponses: rawQpqEventRecordResponses }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const eventParams = rawEventParams as EventInput;
    const qpqEventRecordResponses = rawQpqEventRecordResponses as EitherActionResult<InternalEventOutput>[];

    const [sqsEvent] = eventParams;

    const batchItemFailures: SQSBatchItemFailure[] = qpqEventRecordResponses
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => !record.success)
      .map(({ index }) => ({
        itemIdentifier: sqsEvent.Records[index].messageId,
      }));

    // Transform back to api gateway
    return actionResult<EventOutput>({
      batchItemFailures,
    });
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
