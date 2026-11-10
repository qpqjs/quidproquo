import { type AiStreamUsage, sumAiStreamUsage } from '@qpqjs/core';

import type { EventDocAiState } from '../types/EventDocAiState';

/** Token usage of the open chat, and its charge when it has one, summed over its finalized assistant messages. Empty when usage is not sent to the browser. */
export const selectEventDocAiChatUsage = (state: EventDocAiState): AiStreamUsage =>
  sumAiStreamUsage(state.chatMessages.flatMap((message) => (message.usage ? [message.usage] : [])));
