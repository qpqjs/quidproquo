/** Where a config sync answers: the websocket connection that asked and the service whose settings are shown. */
export type AdminConfigSyncTarget = {
  // The websocket connection that asked, as the connection-info context holds it.
  connectionId?: string;
  correlationId?: string;
  // The service whose settings these are, shown beside each one.
  service: string;
};
