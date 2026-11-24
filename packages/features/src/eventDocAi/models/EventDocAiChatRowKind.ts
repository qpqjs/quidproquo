/** What one row of a chat holds. The value is what is stored on the row, so a member's value must never change. */
export enum EventDocAiChatRowKind {
  // One block of text: a question, or part of a reply.
  Text = 'text',
  // One block of the model's thinking.
  Reasoning = 'reasoning',
  // A reference to an attachment the user uploaded.
  File = 'file',
  // One tool call, with its input and its output.
  ToolUse = 'toolUse',
  // Token usage of one reply. Never sent to a browser that must not see usage.
  Usage = 'usage',
}
