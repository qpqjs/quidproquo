// The transport relay appended to every eventDocAi wire payload by the caller
// wrapper (askEventDocAiServiceRequest) and stripped back off by the handler
// wrapper (eventDocAiServiceRequest) — payload models stay docId-free.
export type EventDocAiDocRef = {
  docId: string;
};
