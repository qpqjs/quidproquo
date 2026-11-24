/**
 * Most bytes of rows one page of a chat's history holds, so the page fits in one websocket message with room
 * for the message around it. A page always holds at least one row; a row cannot be bigger than this allows.
 */
export const EVENT_DOC_AI_CHAT_PAGE_MAX_BYTES = 100_000;
