/**
 * The chat list table used while a chat was saved as one file. Nothing reads or writes it. It stays declared,
 * marked deleteOnRemove, so the release that stops declaring it deletes it.
 */
export const eventDocAiRetiredChatListStoreName = (storeName: string): string => `${storeName}AiChats`;
