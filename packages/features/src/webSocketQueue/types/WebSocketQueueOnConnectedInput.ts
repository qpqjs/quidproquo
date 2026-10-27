// Payload handed to a websocket queue's `onConnected` inline function as soon
// as a connection opens — BEFORE any authenticate, so hooks must only push
// PUBLIC state. Runs with the websocket connection-info context provided, so
// the hook can askSendMessage back to the connection directly.
export type WebSocketQueueOnConnectedInput = {
  connectionId: string;
};
