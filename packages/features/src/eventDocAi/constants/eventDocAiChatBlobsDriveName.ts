/**
 * The storage drive holding the chat values too big for a row, derived from the collection's store name
 * (mirrors eventDocStorageDriveName's convention).
 */
export const eventDocAiChatBlobsDriveName = (storeName: string): string => `${storeName}AiChatBlobs`.toLowerCase();
