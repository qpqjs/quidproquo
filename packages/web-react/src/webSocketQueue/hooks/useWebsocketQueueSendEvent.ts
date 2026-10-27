import { generateUuid } from 'quidproquo-core';
import {
  AnyWebSocketQueueEventMessageWithCorrelation,
  WebSocketQueueServerEventMessageServiceRequestResponse,
  WebSocketQueueServerMessageEventType,
} from 'quidproquo-features';
import { WebsocketService, WebsocketServiceEvent } from 'quidproquo-web';

import { useRef } from 'react';

import { useFastCallback } from '../../hooks';
import { useSubscribeToWebsocket, useWebsocketApi } from '../../websocket';

export const useWebsocketQueueSendEvent = <TSend extends AnyWebSocketQueueEventMessageWithCorrelation>(
  onCorrelatedMessage?: (event: AnyWebSocketQueueEventMessageWithCorrelation) => void,
) => {
  const websocketApi = useWebsocketApi();
  const activeCorrelationsRef = useRef<Set<string>>(new Set());
  const pendingResolversRef = useRef<Map<string, (payload: any) => void>>(new Map());

  // Subscribe to ALL messages, filter by active correlationIds
  const handleMessage = useFastCallback((_ws: WebsocketService, rawEvent?: Event) => {
    if (!rawEvent) return;

    try {
      const parsed: AnyWebSocketQueueEventMessageWithCorrelation = JSON.parse((rawEvent as MessageEvent).data);
      if (!parsed.correlationId || !activeCorrelationsRef.current.has(parsed.correlationId)) {
        return;
      }

      if (parsed.type === WebSocketQueueServerMessageEventType.ServiceRequestResponse) {
        const resolve = pendingResolversRef.current.get(parsed.correlationId);
        if (resolve) {
          resolve((parsed as WebSocketQueueServerEventMessageServiceRequestResponse).payload);

          // Only the resolver is retired: it has done its job, and a promise settles once.
          //
          // The CORRELATION deliberately stays active. It is a subscription, not a request,
          // and it is live for as long as the component that opened it is mounted. Retiring
          // it here used to be invisible because a response was always the last message sent,
          // but a handler that responds first and keeps streaming (a batch that reports
          // progress per record, say) would have every later message silently dropped by the
          // guard above.
          pendingResolversRef.current.delete(parsed.correlationId);
        }
      } else {
        onCorrelatedMessage?.(parsed);
      }
    } catch {
      // Not JSON or not a queue message — ignore
    }
  });

  useSubscribeToWebsocket(WebsocketServiceEvent.MESSAGE, handleMessage);

  // Send with auto-generated correlationId, register it as active
  const sendEvent = useFastCallback((event: Omit<TSend, 'correlationId'>): Promise<any> => {
    if (!websocketApi) {
      return Promise.resolve(undefined);
    }

    const correlationId = generateUuid();
    activeCorrelationsRef.current.add(correlationId);

    const isServiceRequest = event.type.startsWith('qpq/serviceRequest/');

    if (isServiceRequest) {
      const promise = new Promise<any>((resolve) => {
        pendingResolversRef.current.set(correlationId, resolve);
      });

      websocketApi.sendEvent({ ...event, correlationId } as TSend);

      return promise;
    }

    websocketApi.sendEvent({ ...event, correlationId } as TSend);

    return Promise.resolve(undefined);
  });

  return sendEvent;
};
