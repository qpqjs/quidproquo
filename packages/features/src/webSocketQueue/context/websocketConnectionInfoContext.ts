import { AskResponse, askThrowError, createContextIdentifier, createContextProvider, createContextReader, ErrorTypeEnum } from 'quidproquo-core';

export type WebsocketConnectionInfo = {
  apiName?: string;
  connectionId?: string;
  correlationId?: string;
};

const websocketConnectionInfoContextDefaultValue: WebsocketConnectionInfo = {};

export const websocketConnectionInfoContext = createContextIdentifier('websocket-connection-info', websocketConnectionInfoContextDefaultValue);

export const askWebsocketReadConnectionInfo = createContextReader(websocketConnectionInfoContext);

export const askWebsocketProvideConnectionInfo = createContextProvider(websocketConnectionInfoContext, (context: WebsocketConnectionInfo) => context);

export function* askWebsocketReadApiNameOrThrow(): AskResponse<string> {
  const { apiName } = yield* askWebsocketReadConnectionInfo();

  if (!apiName) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, 'WebSocket Api Name not found');
  }

  return apiName;
}
