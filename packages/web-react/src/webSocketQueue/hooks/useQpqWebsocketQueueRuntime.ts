import { AnyWebSocketQueueEventMessageWithCorrelation, WebSocketQueueServerMessageEventType } from 'quidproquo-features';

import { useRef } from 'react';

import { ActionProcessorListResolverFactory } from '../../runtime/ActionProcessorListResolverFactory';
import { QpqRuntimeDefinition } from '../../runtime/createQpqRuntimeDefinition';
import { QpqApi, QpqMappedApi } from '../../runtime/QpqMappedApi';
import { useQpqRuntime } from '../../runtime/useQpqRuntime';
import { getServiceRequestActionProcessor } from './actionProcessor/getServiceRequestActionProcessor';
import { useWebsocketQueueSendEvent } from './useWebsocketQueueSendEvent';

export function useQpqWebsocketQueueRuntime<TState, TAction, TApi extends QpqApi>(
  definition: QpqRuntimeDefinition<TState, TAction, TApi>,
  instanceName?: string,
  getActionProcessors?: ActionProcessorListResolverFactory<TState>,
): [QpqMappedApi<TApi>, TState, (action: any) => void, (event: Omit<AnyWebSocketQueueEventMessageWithCorrelation, 'correlationId'>) => Promise<any>] {
  const sendEventRef = useRef<((event: Omit<AnyWebSocketQueueEventMessageWithCorrelation, 'correlationId'>) => Promise<any>) | null>(null);

  const mergedFactory: ActionProcessorListResolverFactory<TState> = (dispatch, getCurrentState) => {
    const serviceResolver = async () => getServiceRequestActionProcessor(sendEventRef);
    const callerResolver = getActionProcessors?.(dispatch, getCurrentState);

    return async (qpqConfig, dynamicModuleLoader) => ({
      ...(await serviceResolver()),
      ...(callerResolver ? await callerResolver(qpqConfig, dynamicModuleLoader) : {}),
    });
  };

  const [api, state, dispatch] = useQpqRuntime(definition, instanceName, mergedFactory);

  const sendEvent = useWebsocketQueueSendEvent((event) => {
    if (event.type === WebSocketQueueServerMessageEventType.StateDispatch) {
      dispatch((event as any).payload);
    }
  });

  sendEventRef.current = sendEvent;

  return [api, state, dispatch, sendEvent];
}
