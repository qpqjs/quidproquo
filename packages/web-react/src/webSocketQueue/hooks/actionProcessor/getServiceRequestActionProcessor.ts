import { ActionProcessorList, actionResult, actionResultError, Nullable } from '@qpqjs/core';
import { AnyWebSocketQueueEventMessageWithCorrelation, ServiceActionType } from '@qpqjs/features';

import { RefObject } from 'react';

export const getServiceRequestActionProcessor = (
  sendEventRef: RefObject<Nullable<(event: Omit<AnyWebSocketQueueEventMessageWithCorrelation, 'correlationId'>) => Promise<any>>>,
): ActionProcessorList => ({
  [ServiceActionType.Request]: async ({ serviceName, method, payload }: { serviceName: string; method: string; payload: any }) => {
    const response = await sendEventRef.current?.({ type: `qpq/serviceRequest/${serviceName}/${method}`, payload } as any);

    if (response && !response.success) {
      return actionResultError(response.error.errorType, response.error.errorText, response.error.errorStack);
    }

    return actionResult(response?.result);
  },
});
