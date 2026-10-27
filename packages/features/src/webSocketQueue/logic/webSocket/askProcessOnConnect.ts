import { askCatch, askConfigGetGlobal, askInlineFunctionExecute } from 'quidproquo-core';

import { getWebSocketQueueGlobalConfigKeyForOnConnected } from '../../config/defineWebSocketQueue';
import { askWebsocketReadApiNameOrThrow } from '../../context';
import { webSocketConnectionData } from '../../data';
import { Connection } from '../../types';
import { WebSocketQueueOnConnectedInput } from '../../types/WebSocketQueueOnConnectedInput';

export function* askProcessOnConnect(id: string, requestTime: string, requestTimeEpoch: number, ip: string) {
  const newConnection: Connection = {
    id,
    requestTime,
    requestTimeEpoch,
    ip,
  };

  yield* webSocketConnectionData.askUpsert(newConnection);

  // Connect-time sync hook: let a configured feature push current PUBLIC state
  // to the fresh connection (e.g. the active maintenance set) — deliberately
  // pre-auth, since a pre-login client must also see a "site is down" banner.
  // Failures are swallowed — a sync problem must never break the connect.
  const apiName = yield* askWebsocketReadApiNameOrThrow();
  const onConnected = yield* askConfigGetGlobal<string>(getWebSocketQueueGlobalConfigKeyForOnConnected(apiName));
  if (onConnected) {
    yield* askCatch(askInlineFunctionExecute<void, WebSocketQueueOnConnectedInput>(onConnected, { connectionId: id }));
  }
}
