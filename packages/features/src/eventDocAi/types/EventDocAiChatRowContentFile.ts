/**
 * The on-drive shape of one chat row's content that was too big for the row. The content is wrapped so the file
 * is always a JSON object, whatever the content is (a tool call's input and output, or a string of text).
 */
export type EventDocAiChatRowContentFile = {
  content: unknown;
};
