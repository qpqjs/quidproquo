import {
  actionResult,
  askEventTransformResponseResultBase,
  askLogCreate,
  AskResponse,
  createActionProcessor,
  EventTransformResponseResultActionPayload,
  generateUuid,
  getProcessCustomImplementation,
  LogLevelEnum,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { EventInput, EventOutput, InternalEventRecord } from './types';

/** Logs a failed websocket handler run at fatal level; the gateway is always answered with a 500. */
export function* askTransformResponseStory({
  eventParams,
  qpqEventRecordResponses: [record],
}: EventTransformResponseResultActionPayload<EventInput, InternalEventRecord>): AskResponse<EventOutput> {
  if (record && !record.success) {
    yield* askLogCreate(LogLevelEnum.Fatal, record.error.errorText, record.error.errorStack);
  }

  return {
    statusCode: 500,
  };
}

const getProcessTransformResponseResult = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventTransformResponseResultBase> => {
  // Create a custom runtime for errored responses so we can log them out
  const errorCustomImplementation = getProcessCustomImplementation<ProcessorFor<typeof askEventTransformResponseResultBase>>(
    qpqConfig,
    askTransformResponseStory,
    'Transform Errored Websocket Response',
    null,
    () => new Date().toISOString(),
    generateUuid,
  );

  return async (payload, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    if (payload.qpqEventRecordResponses.some((r) => !r.success)) {
      // We only wan't to run this for errors, because a custom imp is slower then a regular imp
      return await errorCustomImplementation(payload, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry);
    }

    return actionResult<EventOutput>({
      statusCode: 200,
    });
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
