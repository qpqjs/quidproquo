import { type AiStreamUsage, sumAiStreamUsage } from 'quidproquo-core';

import type { EventDocAiState } from '../EventDocAiState';

/** Token usage of the open chat, summed over its finalized assistant messages. Empty when usage is not sent to the browser. */
export const selectEventDocAiChatUsage = (state: EventDocAiState): AiStreamUsage =>
  sumAiStreamUsage(state.chatMessages.flatMap((message) => (message.usage ? [message.usage] : [])));
