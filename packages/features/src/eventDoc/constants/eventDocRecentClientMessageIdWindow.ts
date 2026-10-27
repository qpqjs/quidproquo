/**
 * How many accepted clientMessageIds a folded state remembers for retry dedup (EventDocDocument.recentClientMessageIds).
 * Kept small so folded state stays bounded; a duplicate arriving more than this many events after its original is applied again.
 */
export const EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW = 10;
