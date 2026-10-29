import { AskResponse } from '@qpqjs/core';

import { webSocketConnectionData } from '../../data';
import { webSocketSubscriptionData } from '../../data/subscriptionData';

/** Drops the connection record and every subscription filed for it. */
export function* askWebSocketQueueProcessDisconnect(id: string): AskResponse<void> {
  yield* webSocketConnectionData.askConnectionDeleteByConnectionId(id);
  yield* webSocketSubscriptionData.askConnectionDeleteByConnectionId(id);
}
