/** Opt-in for pushing a head-moved message over one or more websocket queues after every append to the collection. */
export type EventDocSyncOptions = {
  // The defineWebSocketQueue api(s) the collection's service can send on; every one gets the same push.
  websocketApiName: string | string[];
};
