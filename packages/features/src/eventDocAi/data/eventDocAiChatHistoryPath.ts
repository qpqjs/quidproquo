// Storage layout for one chat's history on the chat drive.
export const eventDocAiChatHistoryPath = (docId: string, chatId: string): string => `${docId}/${chatId}/history.json`;
