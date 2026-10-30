import { ActionProcessorListResolver, actionResult, actionResultError, createActionProcessor, Nullable, ProcessorFor } from '@qpqjs/core';
import { AnyWebSocketQueueEventMessageWithCorrelation, askServiceRequestBase } from '@qpqjs/features';

import { RefObject } from 'react';

type SendEvent = (event: Omit<AnyWebSocketQueueEventMessageWithCorrelation, 'correlationId'>) => Promise<any>;

const getProcessServiceRequest =
  (sendEventRef: RefObject<Nullable<SendEvent>>): ProcessorFor<typeof askServiceRequestBase> =>
  async ({ serviceName, method, payload }) => {
    const response = await sendEventRef.current?.({ type: `qpq/serviceRequest/${serviceName}/${method}`, payload } as any);

    if (response && !response.success) {
      return actionResultError(response.error.errorType, response.error.errorText, response.error.errorStack);
    }

    return actionResult(response?.result);
  };

/** Answers service requests over the websocket; the sender ref is filled once the socket is up. */
export const getServiceRequestActionProcessor = (sendEventRef: RefObject<Nullable<SendEvent>>): ActionProcessorListResolver =>
  createActionProcessor(askServiceRequestBase, () => getProcessServiceRequest(sendEventRef));
