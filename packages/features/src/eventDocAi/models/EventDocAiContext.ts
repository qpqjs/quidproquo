// The document an AI chat is attached to. Provided as QPQ context: by the UI
// around the chat panel (composites read it instead of carrying config in
// state), and by the ChatSend handler around the prompt stream, tool
// executors inherit the session context, so tools read the TRUSTED docId from
// here rather than trusting the model to pass it.
export type EventDocAiContext = {
  serviceName: string;
  type: string;
  docId: string;
  // The chat a turn is running for. Only set while a turn runs on the server, so a tool that acts on the chat
  // itself reads the trusted id from here. Absent everywhere else.
  chatId?: string;
};
