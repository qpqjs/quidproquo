/** The two mapped workspace verbs live sync drives: a head-moved push and the tail pull after a reconnect. */
export type EventDocWorkspaceSyncApi = {
  syncHeadMoved: (slotKey: string, headEventId: number, clientMessageId?: string) => Promise<void>;
  refresh: (slotKey?: string) => Promise<void>;
};
