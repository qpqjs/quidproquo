/** Opt-in for pushing a head-moved message over a websocket queue after every append to the collection. */
export type EventDocSyncOptions = {
  // The defineWebSocketQueue api the collection's service can send on.
  websocketApiName: string;
};
