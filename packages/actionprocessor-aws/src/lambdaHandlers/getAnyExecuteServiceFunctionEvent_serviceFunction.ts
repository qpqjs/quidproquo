import { DynamicModuleLoader, QPQConfig, QpqRuntimeType, StorySession, toCrossServiceSession } from '@qpqjs/core';
import { ExecuteServiceFunctionEvent } from '@qpqjs/webserver';

import { getLambdaServiceFunctionEventProcessor } from '../getActionProcessor';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';

// TODO: @joe-coady: also declared in @qpqjs/dev-server (serviceFunction/types.ts); this
// cross-layer shape belongs in @qpqjs/webserver as a named model.
type AnyExecuteServiceFunctionEventWithSession = ExecuteServiceFunctionEvent<unknown[]> & {
  storySession: StorySession;
};

export const getAnyExecuteServiceFunctionEvent_serviceFunction = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<AnyExecuteServiceFunctionEventWithSession>(
    QpqRuntimeType.SERVICE_FUNCTION_EXE,
    // Service functions are invoked by another qpq service, which passes its
    // session along so depth/context carry across the boundary. Filtered on the
    // way in as well as out, so the payload cannot plant service-local state.
    (event) => toCrossServiceSession(event.storySession),
    getLambdaServiceFunctionEventProcessor,
    dynamicModuleLoader,
    qpqConfig,
  );
