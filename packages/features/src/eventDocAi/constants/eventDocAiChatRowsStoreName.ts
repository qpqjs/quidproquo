/** The KVS table holding a collection's chat messages, one row per piece of a message (partition docId#chatId, sort a sortable row id). */
export const eventDocAiChatRowsStoreName = (storeName: string): string => `${storeName}AiChatRows`;
