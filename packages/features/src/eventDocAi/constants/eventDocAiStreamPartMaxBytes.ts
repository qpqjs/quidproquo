/**
 * The largest stream part forwarded to the browser as it arrives. A websocket message over 128 KB is never
 * delivered, so a bigger part (a tool result holding a whole document, say) is held back and the browser
 * reloads the chat once the reply is saved. Kept under the limit to leave room for the message around the part.
 */
export const EVENT_DOC_AI_STREAM_PART_MAX_BYTES = 100_000;
