// One tool invocation within a message: the call input paired with its result
// (output is absent while the call is still running in a live stream).
export type EventDocAiToolUse = {
  toolName: string;
  input: unknown;
  output?: unknown;
  // The provider's call id, used to pair streamed argument fragments and the
  // result with this call. Absent on providers that emit the call whole.
  toolCallId?: string;
};
