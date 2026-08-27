import { actionResult, createActionProcessor, generateUuid, getProcessCustomImplementation, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { askRouteAuthValidationDecode, RouteAuthDecodeOutcome, RouteAuthValidationActionType } from '../../actions/routeAuthValidation';
import { askRouteAuthValidationDecodeDefault } from '../../stories/askRouteAuthValidationDecodeDefault';

const getProcessRouteAuthValidationDecode = (qpqConfig: QPQConfig): ProcessorFor<typeof askRouteAuthValidationDecode> => {
  const decodeAuth = getProcessCustomImplementation<ProcessorFor<typeof askRouteAuthValidationDecode>>(
    qpqConfig,
    askRouteAuthValidationDecodeDefault,
    'Route Auth Validation Decode',
    null,
    () => new Date().toISOString(),
    generateUuid,
  );

  return async (payload, session, actionProcessorList, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const [result, error] = await decodeAuth(payload, session, actionProcessorList, logger, updateSession, dynamicModuleLoader, streamRegistry);

    // A decode that errored (or returned nothing) is invalid, never
    // notApplicable: failing open here would skip token auth entirely.
    if (error || !result) {
      return actionResult({ outcome: RouteAuthDecodeOutcome.invalid });
    }

    return actionResult(result);
  };
};

export const getRouteAuthValidationDecodeActionProcessor = createActionProcessor(askRouteAuthValidationDecode, getProcessRouteAuthValidationDecode);
