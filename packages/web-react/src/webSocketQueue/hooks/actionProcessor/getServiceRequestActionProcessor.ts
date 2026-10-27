import { ActionProcessorList, actionResult, actionResultError } from 'quidproquo-core';
import { AnyWebSocketQueueEventMessageWithCorrelation, ServiceActionType } from 'quidproquo-features';

import { RefObject } from 'react';

export const getServiceRequestActionProcessor = (
  sendEventRef: RefObject<((event: Omit<AnyWebSocketQueueEventMessageWithCorrelation, 'correlationId'>) => Promise<any>) | null>,
): ActionProcessorList => ({
  [ServiceActionType.Request]: async ({ serviceName, method, payload }: { serviceName: string; method: string; payload: any }) => {
    const response = await sendEventRef.current?.({ type: `qpq/serviceRequest/${serviceName}/${method}`, payload } as any);

    if (response && !response.success) {
      return actionResultError(response.error.errorType, response.error.errorText, response.error.errorStack);
    }

    return actionResult(response?.result);
  },
});
