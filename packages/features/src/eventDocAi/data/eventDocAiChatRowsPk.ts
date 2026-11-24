/**
 * The partition key of a chat's rows. The document id is part of it on purpose: a chat request is authorised
 * against its document, so a chat id sent with another document finds no rows.
 */
export const eventDocAiChatRowsPk = (docId: string, chatId: string): string => `${docId}#${chatId}`;
