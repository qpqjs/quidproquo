import {
  actionResult,
  actionResultError,
  createActionProcessor,
  DynamicModuleLoader,
  ProcessorFor,
  QPQConfig,
  StoryResult,
  toCrossServiceSession,
} from 'quidproquo-core';
import { askServiceFunctionExecuteBase, ServiceFunctionActionType } from 'quidproquo-webserver';

import { eventBus } from '../../../logic/eventBus';
import { AnyExecuteServiceFunctionEventWithSession } from '../../core/event/node/serviceFunction/types';

const getProcessExecute = (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): ProcessorFor<typeof askServiceFunctionExecuteBase> => {
  return async ({ functionName, service, payload, isAsync }, session) => {
    const serviceFunctionEvent: AnyExecuteServiceFunctionEventWithSession = {
      functionName: functionName,
      serviceName: service,
      payload: payload as any[],
      storySession: toCrossServiceSession(session),
    };

    const eventPromise: Promise<StoryResult<[AnyExecuteServiceFunctionEventWithSession], any>> = eventBus.publishAndWaitForResponse(
      ServiceFunctionActionType.Execute,
      serviceFunctionEvent,
    );

    if (isAsync) {
      return actionResult(void 0);
    }

    const response = await eventPromise;

    if (response.error) {
      return actionResultError(response.error.errorType, response.error.errorText, response.error.errorStack);
    }

    console.log('Result', response.result);

    return actionResult(response.result);
  };
};

export const getServiceFunctionExecuteActionProcessor = createActionProcessor(askServiceFunctionExecuteBase, getProcessExecute);
