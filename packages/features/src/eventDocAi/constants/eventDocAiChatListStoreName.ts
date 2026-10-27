// The KVS table listing a collection's chats (partition docId, sort chatId).
export const eventDocAiChatListStoreName = (storeName: string): string => `${storeName}AiChats`;
