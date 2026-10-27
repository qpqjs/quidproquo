import { AnyEventMessage } from 'quidproquo-core';

import { useFastCallback } from '../../hooks';
import { useWebsocketApi } from './useWebsocketApi';

export const useWebsocketSendEvent = <E extends AnyEventMessage = AnyEventMessage>() => {
  const websocketApi = useWebsocketApi();

  const sendMessage = useFastCallback((event: E) => {
    if (websocketApi) {
      websocketApi.sendEvent(event);
    }
  });

  return sendMessage;
};
