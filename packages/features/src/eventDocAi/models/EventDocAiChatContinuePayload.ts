// Everything a fresh execution needs to resume a turn; the rest (connection,
// correlation, scope, actor) travels in the session.
export type EventDocAiChatContinuePayload = {
  docId: string;
  chatId: string;
  // Consecutive resumes caused by the output token cap, so a model that keeps
  // overrunning it is stopped instead of retried forever.
  lengthResumes: number;
};
