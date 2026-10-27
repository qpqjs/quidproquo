import type { QpqIsoDateTime } from '@qpqjs/core';

// One row in a collection's chat-list store: a chat scoped to a single eventDoc.
export type EventDocAiChatSummary = {
  docId: string;
  chatId: string;
  name: string;
  createdAt: QpqIsoDateTime;
  updatedAt: QpqIsoDateTime;
  createdByUserId: string;
};
