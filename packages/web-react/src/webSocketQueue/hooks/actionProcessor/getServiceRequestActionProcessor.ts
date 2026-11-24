import { ActionProcessorListResolver, actionResult, actionResultError, createActionProcessor, Nullable, ProcessorFor } from '@qpqjs/core';
import { AnyWebSocketQueueEventMessageWithCorrelation, askServiceRequestBase } from '@qpqjs/features';

import { RefObject } from 'react';

type SendEvent = (event: Omit<AnyWebSocketQueueEventMessageWithCorrelation, 'correlationId'>) => Promise<any>;

// Stands in for a response that never arrived, so the race below can tell the two apart.
const TIMED_OUT = Symbol('service request timed out');

/** The response, or TIMED_OUT when a time limit is set and passes first. The timer is always cleared. */
const waitForResponse = async (response: Promise<any>, timeoutMs?: number): Promise<any> => {
  if (timeoutMs === undefined) {
    return response;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
  });

  try {
    return await Promise.race([response, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

const getProcessServiceRequest =
  (sendEventRef: RefObject<Nullable<SendEvent>>): ProcessorFor<typeof askServiceRequestBase> =>
  async ({ serviceName, method, payload, timeoutMs }) => {
    const sent = sendEventRef.current?.({ type: `qpq/serviceRequest/${serviceName}/${method}`, payload } as any);
    const response = await waitForResponse(Promise.resolve(sent), timeoutMs);

    if (response === TIMED_OUT) {
      return actionResultError(askServiceRequestBase.errorType.Timeout, 'The server did not respond in time');
    }

    if (response && !response.success) {
      return actionResultError(response.error.errorType, response.error.errorText, response.error.errorStack);
    }

    return actionResult(response?.result);
  };

/** Answers service requests over the websocket; the sender ref is filled once the socket is up. */
export const getServiceRequestActionProcessor = (sendEventRef: RefObject<Nullable<SendEvent>>): ActionProcessorListResolver =>
  createActionProcessor(askServiceRequestBase, () => getProcessServiceRequest(sendEventRef));
