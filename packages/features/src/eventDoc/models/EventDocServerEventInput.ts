/** One server-authored event for askEventDocAppendServerEvents; the append mints ids and stamps actor and clock. */
export type EventDocServerEventInput<T = unknown> = {
  type: string;
  data: T;
  version: number;
  // An idempotency key the caller already holds (a queue message id), used in place of a minted one. The fold refuses an
  // event whose key is among the document's last EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW, so a redelivery counts once.
  clientMessageId?: string;
};
