import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { WebsocketEvent } from '../types';

export const fromJsonWebsocketEventRequest = <T>(websocketJsonEvent: WebsocketEvent<string>): T => {
  if (!websocketJsonEvent.body) {
    throw new Error('websocketJsonEvent.body is undefined');
  }

  try {
    const item: T = JSON.parse(websocketJsonEvent.body);
    return item;
  } catch {
    throw new Error('Unable to parse incoming json body from websocket event.');
  }
};

export function* askFromJsonWebsocketEventRequest<T>(websocketJsonEvent: WebsocketEvent<string>): AskResponse<T> {
  if (!websocketJsonEvent.body) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, 'websocketJsonEvent.body is undefined');
  }

  try {
    const item: T = JSON.parse(websocketJsonEvent.body);
    return item;
  } catch {
    return yield* askThrowError(ErrorTypeEnum.Invalid, 'Unable to parse incoming json from WebsocketEvent.');
  }
}
