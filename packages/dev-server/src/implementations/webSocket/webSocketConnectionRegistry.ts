import { WebSocket, WebSocketServer } from 'ws';

// The live websocket connection state, extracted into a LEAF module (imports only
// 'ws') so both sides of the dev server can reach it without importing each other:
// webSocketImplementation registers servers/connections here, while the
// WebsocketSendMessage action processor imports sendMessageToWebSocketConnection
// from here. Importing the implementation from the processor instead would close
// an import cycle (implementation -> processEvent -> action processors ->
// implementation).
export type RegisteredWebSocketServer = {
  service: string;
  apiName: string;
  server: WebSocketServer;
  connections: Record<string, WebSocket>;
};

const globals: { allServers: RegisteredWebSocketServer[] } = {
  allServers: [],
};

export const setRegisteredWebSocketServers = (servers: RegisteredWebSocketServer[]): void => {
  globals.allServers = servers;
};

export const getRegisteredWebSocketServers = (): RegisteredWebSocketServer[] => globals.allServers;

export const findRegisteredWebSocketServer = (service: string, apiName: string): RegisteredWebSocketServer | undefined =>
  globals.allServers.find((s) => s.service === service && s.apiName === apiName);

export const sendMessageToWebSocketConnection = async (
  service: string,
  websocketApiName: string,
  connectionId: string,
  payload: any,
): Promise<void> => {
  const wsConnection = findRegisteredWebSocketServer(service, websocketApiName)?.connections?.[connectionId];
  if (!wsConnection) {
    return;
  }

  wsConnection.send(JSON.stringify(payload));
};
