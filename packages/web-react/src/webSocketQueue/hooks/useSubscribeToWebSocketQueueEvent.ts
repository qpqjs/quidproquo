import { AnyWebSocketQueueEventMessageWithCorrelation } from '@qpqjs/features';
import { WebSocketServiceEventSubscriptionFunction } from '@qpqjs/web';

import { useSubscribeToWebSocketEvent } from '../../websocket';

export const useSubscribeToWebSocketQueueEvent = <E extends AnyWebSocketQueueEventMessageWithCorrelation>(
  subscriptionType: E['type'],
  callback: WebSocketServiceEventSubscriptionFunction<E>,
) => {
  useSubscribeToWebSocketEvent(subscriptionType, callback);
};
