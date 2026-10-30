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

import { EventInput, EventOutput, InternalEventRecord } from '../types';

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
