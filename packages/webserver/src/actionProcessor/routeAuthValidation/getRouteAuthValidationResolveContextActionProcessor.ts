import { actionResult, createActionProcessor, ProcessorFor } from '@qpqjs/core';

import { askRouteAuthValidationResolveContext } from '../../actions/routeAuthValidation';

const getProcessRouteAuthValidationResolveContext = (): ProcessorFor<typeof askRouteAuthValidationResolveContext> => {
  return async () => actionResult({});
};

/** Default: no extra context. Routes that need some attach their own processor for this action. */
export const getRouteAuthValidationResolveContextActionProcessor = createActionProcessor(
  askRouteAuthValidationResolveContext,
  getProcessRouteAuthValidationResolveContext,
);
