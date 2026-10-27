// Input handed to the `systemPromptGenerator` and `turnContextGenerator` inline
// functions (registered via defineEventDocAi) on every chat turn. The docId is the
// TRUSTED id of the document the chat is scoped to (supplied by the send flow, never
// the model), so generators can safely load that document's state.
export type EventDocAiSystemPromptInput = {
  docId: string;
};
