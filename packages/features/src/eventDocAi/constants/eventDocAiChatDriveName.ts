// The storage drive holding chat histories for a collection, derived from the
// collection's store name (mirrors eventDocStorageDriveName's convention).
export const eventDocAiChatDriveName = (storeName: string): string => `${storeName}AiChats`.toLowerCase();
