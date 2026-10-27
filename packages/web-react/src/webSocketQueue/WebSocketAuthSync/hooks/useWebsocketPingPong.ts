import { WebSocketQueueClientEventMessagePing, WebSocketQueueClientMessageEventType } from 'quidproquo-features';

import { useRunEvery } from '../../../hooks';
import { useWebsocketSendEvent } from '../../../websocket/hooks';

export const useWebsocketPingPong = () => {
  const sendMessage = useWebsocketSendEvent();

  useRunEvery(() => {
    const pingEvent: WebSocketQueueClientEventMessagePing = {
      type: WebSocketQueueClientMessageEventType.Ping,
    };

    sendMessage(pingEvent);
  }, 8 * 60);
};
