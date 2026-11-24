/**
 * Largest content (serialised JSON bytes) a chat row holds itself; anything bigger goes to the chat blobs drive.
 * A row is sent to the browser as it is stored, so this is set well under the 128 KB a websocket message may be,
 * not at what a row could hold.
 */
export const EVENT_DOC_AI_CHAT_ROW_INLINE_MAX_BYTES = 64 * 1024;
