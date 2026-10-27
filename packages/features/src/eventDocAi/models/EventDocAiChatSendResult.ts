// The streamed content arrives via StateDispatch effects while the request is
// in flight; the response itself only signals completion. `complete: false`
// means the turn halted with work outstanding (a client-side tool call, or the
// runtime deadline) and everything so far is saved, so it is resumable.
export type EventDocAiChatSendResult = {
  complete: boolean;
};
