/** Where one chat row's content lives on the chat blobs drive when it is too big for the row, worked out from the row's key. */
export const eventDocAiChatRowContentPath = (docId: string, chatId: string, sk: string): string => `${docId}/${chatId}/${sk}.json`;
