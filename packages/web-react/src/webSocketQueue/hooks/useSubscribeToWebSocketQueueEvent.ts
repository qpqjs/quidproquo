import { AnyWebSocketQueueEventMessageWithCorrelation } from 'quidproquo-features';
import { WebSocketServiceEventSubscriptionFunction } from 'quidproquo-web';

import { useSubscribeToWebSocketEvent } from '../../websocket';

export const useSubscribeToWebSocketQueueEvent = <E extends AnyWebSocketQueueEventMessageWithCorrelation>(
  subscriptionType: E['type'],
  callback: WebSocketServiceEventSubscriptionFunction<E>,
) => {
  useSubscribeToWebSocketEvent(subscriptionType, callback);
};
