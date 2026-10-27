import { AskResponse } from '@qpqjs/core';

import { webSocketConnectionData } from '../../data/connectionData';
import { webSocketSubscriptionData } from '../../data/subscriptionData';

/** Drops the connection record and every subscription filed for it. */
export function* askProcessOnDisconnect(id: string): AskResponse<void> {
  yield* webSocketConnectionData.askDeleteByConnectionId(id);
  yield* webSocketSubscriptionData.askDeleteByConnectionId(id);
}
