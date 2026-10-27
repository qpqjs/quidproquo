import {
  actionResult,
  actionResultError,
  askEventMatchStoryBase,
  createActionProcessor,
  ErrorTypeEnum,
  EventActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { EventInput, InternalEventRecord, MatchResult } from './types';

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  const serviceFunctions = qpqWebServerUtils.getAllServiceFunctions(qpqConfig);

  return async ({ qpqEventRecord: rawQpqEventRecord }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const qpqEventRecord = rawQpqEventRecord as InternalEventRecord;

    // Find the most relevant match
    const matchedRoute = serviceFunctions.find((sf) => sf.functionName === qpqEventRecord.functionName);

    if (!matchedRoute) {
      return actionResultError(ErrorTypeEnum.NotFound, `service function not found [${qpqEventRecord.functionName}]`);
    }

    return actionResult<MatchResult>({
      runtime: matchedRoute.runtime,
    });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
