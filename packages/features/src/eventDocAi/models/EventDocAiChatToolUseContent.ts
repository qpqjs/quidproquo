/** What a tool call row holds besides the tool's name: what the tool was given and what it answered. */
export type EventDocAiChatToolUseContent = {
  input: unknown;
  // Absent while the call has no result: a client-side tool the user answers in the chat.
  output?: unknown;
};
