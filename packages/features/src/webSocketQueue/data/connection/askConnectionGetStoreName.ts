import { AskResponse } from '@qpqjs/core';

import { getWebSocketQueueKeyValueStoreName } from '../../config/defineWebSocketQueue';
import { askWebsocketApiNameReadOrThrow } from '../../context';

export function* askConnectionGetStoreName(apiNameOverride?: string): AskResponse<string> {
  const apiName = apiNameOverride || (yield* askWebsocketApiNameReadOrThrow());

  return getWebSocketQueueKeyValueStoreName(apiName || 'UNKNOWN-API');
}
