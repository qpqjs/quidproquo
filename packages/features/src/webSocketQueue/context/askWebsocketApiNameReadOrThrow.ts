import { AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import { askWebsocketConnectionInfoRead } from './askWebsocketConnectionInfoRead';

/** The websocket api the current connection belongs to; throws NotFound outside a websocket entry point. */
export function* askWebsocketApiNameReadOrThrow(): AskResponse<string> {
  const { apiName } = yield* askWebsocketConnectionInfoRead();

  if (!apiName) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, 'WebSocket Api Name not found');
  }

  return apiName;
}
